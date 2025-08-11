from flask import Blueprint, request, jsonify, current_app
from .models import User, Queue
from .database import db
from .utils import send_sms
from twilio.twiml.messaging_response import MessagingResponse
from .sockets import socketio
from flask_socketio import join_room, leave_room

bp = Blueprint('routes', __name__, url_prefix='/api')

def get_public_queue():
    users = User.query.order_by(User.line_number, User.place_in_queue).all()
    user_list = [{'id': user.id, 'party_size': user.party_size, 'place_in_queue': user.place_in_queue, 'line_number': user.line_number} for user in users]
    return user_list

def get_admin_queue_data():
    users = User.query.order_by(User.line_number, User.place_in_queue).all()
    return [{'id': user.id, 'name': user.name, 'phone_number': user.phone_number, 'party_size': user.party_size, 'place_in_queue': user.place_in_queue, 'line_number': user.line_number} for user in users]

def broadcast_queue_update():
    queue = Queue.query.first()
    wait_time = queue.wait_time if queue else 0
    
    # Broadcast to admins
    admin_user_list = get_admin_queue_data()
    socketio.emit('queue_update', {'queue': admin_user_list, 'wait_time': wait_time}, to='admin')

    # Broadcast to public
    public_user_list = get_public_queue()
    socketio.emit('queue_update', {'queue': public_user_list, 'wait_time': wait_time}, to='public')

@bp.route('/queue', methods=['GET'])
def get_queue():
    queue = Queue.query.first()
    if not queue:
        return jsonify({'queue': [], 'wait_time': 0})

    user_list = get_public_queue()
    
    return jsonify({'queue': user_list, 'wait_time': queue.wait_time})

def find_best_fit(party_size):
    line_count = current_app.config['LINE_COUNT']
    
    # Get the current state of all lines
    lines = [[] for _ in range(line_count)]
    users = User.query.order_by(User.place_in_queue).all()
    for user in users:
        if user.line_number is not None:
            lines[user.line_number].append(user)

    # Find the line with the minimum current size that can fit the new party
    best_line = -1
    min_line_size = float('inf')

    for i in range(line_count):
        if lines[i] and lines[i][-1].party_size + party_size <= line_count:
             # Simple best fit: find the shortest line
            if len(lines[i]) < min_line_size:
                min_line_size = len(lines[i])
                best_line = i
    
    if best_line == -1:
        # If no existing line can fit, find the first empty line
        for i in range(line_count):
            if not lines[i]:
                best_line = i
                break

    return best_line, len(lines[best_line]) + 1 if best_line != -1 else -1


@bp.route('/join', methods=['POST'])
def join_queue():
    data = request.get_json()
    name = data.get('name')
    phone_number = data.get('phone_number')
    party_size = data.get('party_size', 1)
    line_number_req = data.get('line_number')

    if not name:
        return jsonify({'error': 'Name is required'}), 400

    if line_number_req is not None:
        line_number, place_in_queue = line_number_req, User.query.filter_by(line_number=line_number_req).count() + 1
    else:
        line_number, place_in_queue = find_best_fit(party_size)

    if line_number == -1:
        return jsonify({'error': 'No available space in the queue for this party size.'}), 400

    queue = Queue.query.first()
    if not queue:
        queue = Queue()
        db.session.add(queue)
        db.session.commit()
    
    new_user = User(name=name, phone_number=phone_number, party_size=party_size, line_number=line_number, place_in_queue=place_in_queue)
    
    db.session.add(new_user)
    queue.update_wait_time()
    db.session.commit()

    broadcast_queue_update()

    if phone_number:
        send_sms(phone_number, f'You are in the queue! Your position is {place_in_queue} in line {line_number + 1}. Estimated wait time is {queue.wait_time} minutes.')

    return jsonify({'message': 'Successfully joined queue', 'place_in_queue': place_in_queue, 'line_number': line_number, 'wait_time': queue.wait_time}), 201

@bp.route('/admin/check_password', methods=['POST'])
def check_password():
    data = request.get_json()
    if data.get('password') != current_app.config['ADMIN_PASSWORD']:
        return jsonify({'error': 'Invalid password'}), 401
    return jsonify({'message': 'Password is correct'}), 200

@bp.route('/admin/queue', methods=['POST'])
def get_admin_queue():
    data = request.get_json()
    if data.get('password') != current_app.config['ADMIN_PASSWORD']:
        return jsonify({'error': 'Invalid password'}), 401
    
    queue = Queue.query.first()
    if not queue:
        return jsonify({'queue': [], 'wait_time': 0})

    users = User.query.order_by(User.line_number, User.place_in_queue).all()
    user_list = [{'id': user.id, 'name': user.name, 'phone_number': user.phone_number, 'party_size': user.party_size, 'place_in_queue': user.place_in_queue, 'line_number': user.line_number} for user in users]
    
    return jsonify({'queue': user_list, 'wait_time': queue.wait_time})

@bp.route('/admin/next', methods=['POST'])
def next_in_queue():
    data = request.get_json()
    if data.get('password') != current_app.config['ADMIN_PASSWORD']:
        return jsonify({'error': 'Invalid password'}), 401

    line_number = data.get('line_number')
    if line_number is None:
        return jsonify({'error': 'Line number is required'}), 400

    user = User.query.filter_by(line_number=line_number).order_by(User.place_in_queue).first()
    
    if user:
        if user.phone_number:
            send_sms(user.phone_number, 'You are next in the queue!')
        
        db.session.delete(user)
        
        remaining_users = User.query.filter_by(line_number=line_number).order_by(User.place_in_queue).all()
        for i, u in enumerate(remaining_users):
            u.place_in_queue = i + 1

        queue = Queue.query.first()
        if queue:
            queue.update_wait_time()

        db.session.commit()
        broadcast_queue_update()

    return jsonify({'message': f'Line {line_number} advanced'})

@bp.route('/admin/remove', methods=['POST'])
def remove_from_queue():
    data = request.get_json()
    if data.get('password') != current_app.config['ADMIN_PASSWORD']:
        return jsonify({'error': 'Invalid password'}), 401
        
    user_id = data.get('user_id')
    user = User.query.get(user_id)
    if user:
        line_num = user.line_number
        db.session.delete(user)
        
        if line_num is not None:
            remaining_users = User.query.filter_by(line_number=line_num).order_by(User.place_in_queue).all()
            for i, u in enumerate(remaining_users):
                u.place_in_queue = i + 1
            
        queue = Queue.query.first()
        if queue:
            queue.update_wait_time()
            
        db.session.commit()
        broadcast_queue_update()
    
    return jsonify({'message': 'User removed'})

@socketio.on('connect')
def handle_connect():
    join_room('public')
    broadcast_queue_update()

@socketio.on('admin_connect')
def handle_admin_connect(data):
    if data.get('password') == current_app.config['ADMIN_PASSWORD']:
        join_room('admin')
        # Send initial admin data
        queue = Queue.query.first()
        wait_time = queue.wait_time if queue else 0
        admin_user_list = get_admin_queue_data()
        socketio.emit('queue_update', {'queue': admin_user_list, 'wait_time': wait_time}, to=request.sid)

@bp.route('/sms', methods=['POST'])
def sms_reply():
    body = request.values.get('Body', '').lower().strip()
    phone_number = request.values.get('From', '')

    if body == 'cancel':
        user = User.query.filter_by(phone_number=phone_number).first()
        if user:
            line_num = user.line_number
            db.session.delete(user)
            
            if line_num is not None:
                remaining_users = User.query.filter_by(line_number=line_num).order_by(User.place_in_queue).all()
                for i, u in enumerate(remaining_users):
                    u.place_in_queue = i + 1
            
            queue = Queue.query.first()
            if queue:
                queue.update_wait_time()
            
            db.session.commit()
            broadcast_queue_update()

            response = MessagingResponse()
            response.message('You have been removed from the queue.')
            return str(response)

    return '', 204
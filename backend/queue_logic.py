from flask import current_app
from .models import User, Queue
from .database import db
from .utils import send_sms
from .sockets import socketio

def get_public_queue():
    users = User.query.order_by(User.line_number, User.place_in_queue).all()
    first_in_line_ids = set()
    seen_lines = set()
    for u in users:
        if u.line_number not in seen_lines:
            first_in_line_ids.add(u.id)
            seen_lines.add(u.line_number)
    user_list = []
    for user in users:
        entry = {
            'id': user.id,
            'party_size': user.party_size,
            'place_in_queue': user.place_in_queue,
            'line_number': user.line_number
        }
        if user.id in first_in_line_ids:
            entry['name'] = user.name
        user_list.append(entry)
    return user_list

def get_admin_queue_data():
    users = User.query.order_by(User.line_number, User.place_in_queue).all()
    return [{'id': user.id, 'name': user.name, 'phone_number': user.phone_number, 'party_size': user.party_size, 'place_in_queue': user.place_in_queue, 'line_number': user.line_number} for user in users]

def broadcast_queue_update():
    queue = Queue.query.first()
    wait_time = queue.wait_time if queue else 0
    
    admin_user_list = get_admin_queue_data()
    socketio.emit('queue_update', {'queue': admin_user_list, 'wait_time': wait_time}, to='admin')

    public_user_list = get_public_queue()
    socketio.emit('queue_update', {'queue': public_user_list, 'wait_time': wait_time}, to='public')

def find_best_fit(party_size):
    line_count = current_app.config['LINE_COUNT']
    
    lines = [[] for _ in range(line_count)]
    users = User.query.order_by(User.place_in_queue).all()
    for user in users:
        if user.line_number is not None:
            lines[user.line_number].append(user)

    best_line = -1
    min_line_size = float('inf')

    for i in range(line_count):
        if lines[i] and lines[i][-1].party_size + party_size <= line_count:
            if len(lines[i]) < min_line_size:
                min_line_size = len(lines[i])
                best_line = i
    
    if best_line == -1:
        for i in range(line_count):
            if not lines[i]:
                best_line = i
                break

    return best_line, len(lines[best_line]) + 1 if best_line != -1 else -1

def join_queue_logic(name, phone_number, party_size, line_number_req):
    if not name:
        return {'error': 'Name is required'}, 400

    if line_number_req is not None:
        line_number, place_in_queue = line_number_req, User.query.filter_by(line_number=line_number_req).count() + 1
    else:
        line_number, place_in_queue = find_best_fit(party_size)

    if line_number == -1:
        return {'error': 'No available space in the queue for this party size.'}, 400

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

    return {'message': 'Successfully joined queue', 'place_in_queue': place_in_queue, 'line_number': line_number, 'wait_time': queue.wait_time}, 201

def next_in_queue_logic(line_number):
    if line_number is None:
        return {'error': 'Line number is required'}, 400

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

    return {'message': f'Line {line_number} advanced'}

def remove_from_queue_logic(user_id):
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
    
    return {'message': 'User removed'}

def cancel_by_sms_logic(phone_number):
    user = User.query.filter_by(phone_number=phone_number).first()
    if user:
        remove_from_queue_logic(user.id)
        return True
    return False

from flask import Blueprint, request, jsonify, current_app
from .models import User, Queue
from .database import db
from twilio.twiml.messaging_response import MessagingResponse
from .sockets import socketio
from flask_socketio import join_room, leave_room
from .queue_logic import (
    get_public_queue,
    get_admin_queue_data,
    broadcast_queue_update,
    join_queue_logic,
    next_in_queue_logic,
    remove_from_queue_logic,
    cancel_by_sms_logic,
)

bp = Blueprint('routes', __name__, url_prefix='/api')


@bp.route('/queue', methods=['GET'])
def get_queue():
    queue = Queue.query.first()
    if not queue:
        return jsonify({'queue': [], 'wait_time': 0})

    user_list = get_public_queue()
    
    return jsonify({'queue': user_list, 'wait_time': queue.wait_time})


@bp.route('/join', methods=['POST'])
def join_queue():
    data = request.get_json()
    name = data.get('name')
    phone_number = data.get('phone_number')
    party_size = data.get('party_size', 1)
    line_number_req = data.get('line_number')

    result, status_code = join_queue_logic(name, phone_number, party_size, line_number_req)
    return jsonify(result), status_code


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
    wait_time = queue.wait_time if queue else 0
    
    user_list = get_admin_queue_data()
    
    return jsonify({'queue': user_list, 'wait_time': wait_time})

@bp.route('/admin/next', methods=['POST'])
def next_in_queue():
    data = request.get_json()
    if data.get('password') != current_app.config['ADMIN_PASSWORD']:
        return jsonify({'error': 'Invalid password'}), 401

    line_number = data.get('line_number')
    result = next_in_queue_logic(line_number)
    return jsonify(result)

@bp.route('/admin/remove', methods=['POST'])
def remove_from_queue():
    data = request.get_json()
    if data.get('password') != current_app.config['ADMIN_PASSWORD']:
        return jsonify({'error': 'Invalid password'}), 401
        
    user_id = data.get('user_id')
    result = remove_from_queue_logic(user_id)
    return jsonify(result)

@socketio.on('connect')
def handle_connect():
    join_room('public')
    broadcast_queue_update()

@socketio.on('admin_connect')
def handle_admin_connect(data):
    if data.get('password') == current_app.config['ADMIN_PASSWORD']:
        leave_room('public')
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
        result = cancel_by_sms_logic(phone_number)
        if result:
            response = MessagingResponse()
            response.message('You have been removed from the queue.')
            return str(response)

    return '', 204
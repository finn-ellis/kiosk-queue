from flask import Blueprint, request, jsonify, current_app
from .models import User, Queue
from .db import db
from .queue_logic import (
    get_public_queue,
    get_admin_queue_data,
    join_queue_logic,
    next_in_queue_logic,
    remove_from_queue_logic,
)

def create_blueprint():
    bp = Blueprint('kiosk_queue', __name__)

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
        email = data.get('email')
        party_size = data.get('party_size', 1)
        line_number_req = data.get('line_number')

        result, status_code = join_queue_logic(name, email, party_size, line_number_req)
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
        
    return bp
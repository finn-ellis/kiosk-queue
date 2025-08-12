from flask import request, current_app
from flask_socketio import Namespace, emit, join_room, leave_room
from .models import Queue
from .queue_logic import get_admin_queue_data, broadcast_queue_update

class QueueNamespace(Namespace):
    def on_connect(self):  # client connected to /queue namespace
        join_room('public')
        broadcast_queue_update()

    def on_disconnect(self):
        # Rooms auto-cleaned by flask-socketio; nothing needed
        pass

    def on_admin_connect(self, data):
        password = (data or {}).get('password')
        if password != current_app.config['ADMIN_PASSWORD']:
            emit('admin_error', {'error': 'Invalid password'})
            return
        leave_room('public')
        join_room('admin')
        queue = Queue.query.first()
        wait_time = queue.wait_time if queue else 0
        admin_user_list = get_admin_queue_data()
        emit('queue_update', {'queue': admin_user_list, 'wait_time': wait_time}, to=request.sid)
        emit('admin_status', {'role': 'admin'})

    def on_admin_leave(self):
        leave_room('admin')
        join_room('public')
        broadcast_queue_update()

def create_socket_namespace(socketio):
    ns = QueueNamespace('/queue')
    socketio.on_namespace(ns)
    return ns

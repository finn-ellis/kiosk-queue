from flask import Flask
from flask_socketio import SocketIO
from kiosk_queue import KioskQueue
from kiosk_queue.config import Config

socketio = SocketIO(cors_allowed_origins="*")
kiosk = KioskQueue()

def create_app():
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(Config)
    app.config.from_pyfile('config.py', silent=True)

    kiosk.init_app(app, url_prefix="/api/kiosk", socketio=socketio)
    socketio.init_app(app)
    return app

app = create_app()

if __name__ == "__main__":
    socketio.run(app, debug=True)

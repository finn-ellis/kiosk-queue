from flask import Flask
from flask_cors import CORS

from .database import db
from .routes import bp
from .cli import init_db_command, reset_db_command
from .config import Config
from .sockets import socketio

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    app.config.from_object(Config)

    db.init_app(app)
    app.register_blueprint(bp)
    app.cli.add_command(init_db_command)
    app.cli.add_command(reset_db_command)

    socketio.init_app(app, cors_allowed_origins="*")

    return app

app = create_app()

if __name__ == '__main__':
    socketio.run(app, debug=True)

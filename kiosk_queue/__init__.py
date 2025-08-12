from .db import db
from .routes import create_blueprint
from .cli import init_db_command, reset_db_command
from .sockets import create_socket_namespace
from flask_cors import CORS

class KioskQueue:
    def __init__(self, app=None, *, url_prefix="/api/queue", register_cli=True):
        self.url_prefix = url_prefix
        self._namespace = None
        if app:
            self.init_app(app, url_prefix=url_prefix, register_cli=register_cli)

    def init_app(self, app, *, url_prefix=None, register_cli=True, socketio=None):
        # Config defaults (only set if absent)
        app.config.setdefault("KIOSK_QUEUE_MAX_ACTIVE", 1)
        app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)
        app.config.setdefault("KIOSK_QUEUE_CORS_ORIGINS", "*")
        # Optional: whether to allow credentials (cookies/auth headers) in CORS
        app.config.setdefault("KIOSK_QUEUE_CORS_SUPPORTS_CREDENTIALS", False)

        # Derive CORS origins list
        origins_raw = app.config.get("KIOSK_QUEUE_CORS_ORIGINS", "*")
        if isinstance(origins_raw, str):
            origins_list = [o.strip() for o in origins_raw.split(",") if o.strip()]
        else:
            origins_list = origins_raw or ["*"]

        # Apply CORS only to this extension's HTTP endpoints + Socket.IO path
        effective_prefix = url_prefix or self.url_prefix
        cors_resources = {
            f"{effective_prefix}/*": {"origins": origins_list},
            "/socket.io/*": {"origins": origins_list},  # Socket.IO engine.io endpoint
        }
        CORS(app, resources=cors_resources, supports_credentials=app.config.get("KIOSK_QUEUE_CORS_SUPPORTS_CREDENTIALS", False))

        db.init_app(app)

        bp = create_blueprint()
        app.register_blueprint(bp, url_prefix=url_prefix or self.url_prefix)

        if register_cli:
            app.cli.add_command(init_db_command)
            app.cli.add_command(reset_db_command)

        if socketio:
            # Set socket.io CORS if still default / permissive
            if getattr(socketio, "cors_allowed_origins", None) in (None, "*"):
                socketio.cors_allowed_origins = origins_list
            # attach Socket.IO namespace with DI of logic/services
            self._namespace = create_socket_namespace(socketio)
            app.extensions['socketio'] = socketio

        # Optional: store extension reference
        if not hasattr(app, 'extensions'):
            app.extensions = {}
        app.extensions["kiosk_queue"] = self


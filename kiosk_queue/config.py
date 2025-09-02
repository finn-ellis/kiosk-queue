import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a-secret-key'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///site.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    LINE_COUNT = int(os.environ.get('LINE_COUNT', 2))
    SLOT_TIME = int(os.environ.get('SLOT_TIME', 5)) # in minutes
    RESET_TIME = int(os.environ.get('RESET_TIME', 3)) # in minutes
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD') or 'admin'
    KIOSK_QUEUE_CORS_ORIGINS = os.environ.get('KIOSK_QUEUE_CORS_ORIGINS') or '*'
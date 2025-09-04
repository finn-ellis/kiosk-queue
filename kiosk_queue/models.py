from flask import current_app
from .db import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=True)
    party_size = db.Column(db.Integer, nullable=False, default=1)
    place_in_queue = db.Column(db.Integer, nullable=False)
    line_number = db.Column(db.Integer, nullable=True)
    email_consent = db.Column(db.Boolean, nullable=False, default=False)

class Queue(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    wait_time = db.Column(db.Integer, default=0) # in minutes

    # def update_wait_time(self):
    #     # This logic will need to be more sophisticated for parallel lines
    #     users_in_queue = User.query.count()
    #     self.wait_time = (users_in_queue // current_app.config['LINE_COUNT']) * current_app.config['SLOT_TIME'] + current_app.config['RESET_TIME']
    #     db.session.commit()

class LineStatus(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    line_number = db.Column(db.Integer, nullable=False, unique=True)
    # POSIX timestamp (seconds) when last party occupying front of this line (or spanning across it) was admitted
    last_admitted_time = db.Column(db.Integer, nullable=False, default=0)

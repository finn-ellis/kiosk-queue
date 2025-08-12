from flask import current_app
from .db import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), nullable=True)
    party_size = db.Column(db.Integer, nullable=False, default=1)
    place_in_queue = db.Column(db.Integer, nullable=False)
    line_number = db.Column(db.Integer, nullable=True)

class Queue(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    wait_time = db.Column(db.Integer, default=0) # in minutes

    def update_wait_time(self):
        # This logic will need to be more sophisticated for parallel lines
        users_in_queue = User.query.count()
        self.wait_time = (users_in_queue // current_app.config['LINE_COUNT']) * current_app.config['SLOT_TIME']
        db.session.commit()

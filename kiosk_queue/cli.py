import click
from flask import current_app
from .db import db

@click.command("kiosk-init-db")
def init_db_command():
    with current_app.app_context():
        db.create_all()
    click.echo("Kiosk DB initialized.")

@click.command("kiosk-reset-db")
def reset_db_command():
    with current_app.app_context():
        db.drop_all()
        db.create_all()
    click.echo("Kiosk DB reset.")
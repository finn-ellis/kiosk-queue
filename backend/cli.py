import click
from flask.cli import with_appcontext
from .database import db

@click.command("init-db")
@with_appcontext
def init_db_command():
    """Initializes the database."""
    db.create_all()
    click.echo("Initialized the database.")

@click.command("reset-db")
@with_appcontext
def reset_db_command():
    """Resets the database."""
    db.drop_all()
    db.create_all()
    click.echo("Reset the database.")
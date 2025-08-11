from twilio.rest import Client
from flask import current_app

def send_sms(to, body):
    if not current_app.config['TWILIO_ACCOUNT_SID'] or not current_app.config['TWILIO_AUTH_TOKEN']:
        print("Twilio not configured. Skipping SMS.")
        return

    client = Client(current_app.config['TWILIO_ACCOUNT_SID'], current_app.config['TWILIO_AUTH_TOKEN'])
    try:
        message = client.messages.create(
            body=body,
            from_=current_app.config['TWILIO_PHONE_NUMBER'],
            to=to
        )
        print(f"Message sent to {to}: {message.sid}")
    except Exception as e:
        print(f"Error sending SMS to {to}: {e}")

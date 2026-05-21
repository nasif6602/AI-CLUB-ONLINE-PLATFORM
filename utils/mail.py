from flask_mail import Mail, Message
from flask import current_app

mail = Mail()

def send_confirmation_email(to_email, member_name):
    with current_app.app_context():
        msg = Message(
            subject='🎉 AI Club Membership Approved!',
            recipients=[to_email],
            body=f'''Hi {member_name},

Your membership payment has been verified and approved! You are now an official member of the AI Club.

Enjoy all club benefits:
- Access to exclusive workshops
- Project collaboration opportunities
- Member-only events
- And more!

Welcome aboard! 🚀

Best regards,
AI Club Team
'''
        )
        mail.send(msg)
from flask import Flask, render_template
from flask_cors import CORS
from flask_mail import Mail
from config import Config
from routes.auth import auth_bp
from routes.blog import blog_bp
from routes.membership import membership_bp
from routes.admin import admin_bp
from utils.mail import mail

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, supports_credentials=True)
mail.init_app(app)

app.register_blueprint(auth_bp)
app.register_blueprint(blog_bp)
app.register_blueprint(membership_bp)
app.register_blueprint(admin_bp, url_prefix='/api/admin')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/membership')
def membership_page():
    return render_template('membership.html')

@app.route('/admin-portal')
def admin_portal_page():
    return render_template('admin.html')
    
@app.route('/member-events')
def member_events_page():
    return render_template('member_events.html')

@app.route('/member-resources')
def member_resources_page():
    return render_template('member_resources.html')

@app.route('/member-directory')
def member_directory_page():
    return render_template('member_directory.html')
    
@app.route('/forum')
def forum_page():
    return render_template('forum.html')
@app.route('/help')
def help_page():
    return render_template('help.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
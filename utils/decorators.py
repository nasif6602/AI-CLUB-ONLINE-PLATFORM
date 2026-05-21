from functools import wraps
from flask import request, jsonify, g
from utils.auth import verify_supabase_token, get_user_profile

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing token'}), 401
        token = auth_header.split(' ')[1]
        try:
            payload = verify_supabase_token(token)
            g.user_id = payload['sub']
            g.user_email = payload.get('email')
        except Exception as e:
            return jsonify({'error': str(e)}), 401
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    @login_required
    def decorated(*args, **kwargs):
        profile = get_user_profile(g.user_id)
        if not profile or profile.get('role') != 'admin':
            return jsonify({'error': 'Admin only'}), 403
        g.user_profile = profile
        return f(*args, **kwargs)
    return decorated
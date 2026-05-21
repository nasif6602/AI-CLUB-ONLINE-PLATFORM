from flask import Blueprint, request, jsonify, g
from datetime import datetime
from utils.supabase_client import supabase_request
from utils.decorators import admin_required
from utils.mail import send_confirmation_email

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/membership-requests', methods=['GET'])
@admin_required
def get_membership_requests():
    # Fetch all membership requests
    requests_data = supabase_request('GET', 'membership_requests?order=created_at.desc')
    if not requests_data:
        return jsonify([])

    # Fetch profiles for all user_ids in one go (if possible) or individually
    # For simplicity, we'll fetch each profile individually
    enriched = []
    for req in requests_data:
        user_id = req.get('user_id')
        profile = None
        if user_id:
            profile_data = supabase_request('GET', f'profiles?id=eq.{user_id}&select=full_name,email')
            if profile_data and len(profile_data) > 0:
                profile = profile_data[0]
        req['profiles'] = profile
        enriched.append(req)

    return jsonify(enriched)

@admin_bp.route('/membership-requests/<request_id>/approve', methods=['POST'])
@admin_required
def approve_membership(request_id):
    req = supabase_request('GET', f'membership_requests?id=eq.{request_id}')
    if not req or req[0]['status'] != 'pending':
        return jsonify({'error': 'Invalid request'}), 400

    user_id = req[0]['user_id']

    # Update request
    supabase_request('PATCH', f'membership_requests?id=eq.{request_id}', {
        'status': 'approved',
        'reviewed_by': g.user_id,
        'reviewed_at': datetime.utcnow().isoformat()
    })

    # Update user profile
    supabase_request('PATCH', f'profiles?id=eq.{user_id}', {
        'is_member': True,
        'membership_approved_at': datetime.utcnow().isoformat()
    })

    # Send email
    user_profile = supabase_request('GET', f'profiles?id=eq.{user_id}&select=full_name,email')
    if user_profile:
        try:
            send_confirmation_email(user_profile[0]['email'], user_profile[0]['full_name'])
        except Exception as e:
            print('Email error:', e)

    return jsonify({'success': True})

@admin_bp.route('/membership-requests/<request_id>/reject', methods=['POST'])
@admin_required
def reject_membership(request_id):
    note = request.json.get('note', '')
    supabase_request('PATCH', f'membership-requests?id=eq.{request_id}', {
        'status': 'rejected',
        'admin_note': note,
        'reviewed_by': g.user_id,
        'reviewed_at': datetime.utcnow().isoformat()
    })
    return jsonify({'success': True})
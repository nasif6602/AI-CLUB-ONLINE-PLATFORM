import base64
import uuid
from flask import Blueprint, request, jsonify, g
from datetime import datetime
from utils.supabase_client import supabase_request
from utils.decorators import login_required
import traceback

membership_bp = Blueprint('membership', __name__)

BUCKET_NAME = 'payment-proofs'

def upload_proof_image(base64_data, user_id):
    """Upload base64 image to Supabase Storage and return public URL."""
    # Decode base64
    try:
        # Remove data URL prefix if present
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]
        image_bytes = base64.b64decode(base64_data)
    except Exception as e:
      print(f"Upload error: {e}")   # <-- ADD THIS
      return jsonify({'error': f'Screenshot upload failed: {str(e)}'}), 400

    # Generate unique filename
    filename = f"{user_id}_{uuid.uuid4().hex}.png"
    path = f"proofs/{filename}"

    # Upload using Supabase REST API (requires service key)
    import requests
    from config import Config
    url = f"{Config.SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{path}"
    headers = {
        'Authorization': f'Bearer {Config.SUPABASE_SERVICE_KEY}',
        'apikey': Config.SUPABASE_SERVICE_KEY,
        'Content-Type': 'image/png'
    }
    resp = requests.post(url, headers=headers, data=image_bytes)
    if resp.status_code >= 400:
        raise Exception(f'Upload failed: {resp.text}')

    # Construct public URL
    public_url = f"{Config.SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{path}"
    return public_url

@membership_bp.route('/api/membership/request', methods=['POST'])
@login_required
def submit_payment_request():
    data = request.json
    transaction_id = data.get('transaction_id')
    screenshot = data.get('screenshot')   # optional base64 image

    if not transaction_id:
        return jsonify({'error': 'Transaction ID required'}), 400

    # Check for existing pending request
    existing = supabase_request('GET', f'membership_requests?user_id=eq.{g.user_id}&status=eq.pending')
    if existing and len(existing) > 0:
        return jsonify({'error': 'Already have a pending request'}), 409

    # Always create the base request object FIRST
    new_req = {
        'user_id': g.user_id,
        'transaction_id': transaction_id,
        'status': 'pending',
        'created_at': datetime.utcnow().isoformat()
    }

    # Upload screenshot if provided (non‑blocking: if upload fails, we still save the request)
    if screenshot:
        try:
            proof_url = upload_proof_image(screenshot, g.user_id)
            new_req['proof_image'] = proof_url
        except Exception as e:
            print(f"Upload error (screenshot skipped): {e}")
            # Continue without the image – do NOT return an error
            # You can also return a success but without the image, or add a warning field
            new_req['proof_image'] = None  # or just leave it out

    result = supabase_request('POST', 'membership_requests', new_req)
    return jsonify({'success': True, 'request': result[0] if result else {}}), 201
@membership_bp.route('/api/membership/status', methods=['GET'])
@login_required
def get_membership_status():
    profile = supabase_request('GET', f'profiles?id=eq.{g.user_id}&select=is_member,membership_approved_at')
    profile_data = profile[0] if profile else {}
    is_member = profile_data.get('is_member', False)
    approved_at = profile_data.get('membership_approved_at')

    reqs = supabase_request('GET', f'membership_requests?user_id=eq.{g.user_id}&order=created_at.desc&limit=1')
    request_status = reqs[0] if reqs else None

    return jsonify({
        'is_member': is_member,
        'approved_at': approved_at,
        'request': request_status
    })
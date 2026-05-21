

async function init() {
    if (typeof supabase === 'undefined') {
        document.getElementById('membership-dynamic-content').innerHTML = '<p style="color:var(--red);">Supabase not loaded</p>';
        console.error('supabase is not defined');
        return;
    }
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session?.user) { window.location.href = '/'; return; }
        currentUser = session.user;
        loadMembershipStatus();
    } catch (e) {
        console.error(e);
        document.getElementById('membership-dynamic-content').innerHTML = '<p style="color:var(--red);">Authentication failed. Please log in again.</p>';
    }
}

async function loadMembershipStatus() {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;
    document.getElementById('membership-dynamic-content').innerHTML = '<div class="loader-spinner"></div><p>Loading...</p>';
    try {
        const res = await fetch('/api/membership/status', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('API error ' + res.status);
        const data = await res.json();
        renderUI(data);
    } catch (err) {
        console.error(err);
        document.getElementById('membership-dynamic-content').innerHTML = '<p style="color:var(--red);">Failed to load status. Check console for details.</p>';
    }
}

function renderUI(status) {
    const container = document.getElementById('membership-dynamic-content');
    const instructionsCard = document.getElementById('payment-instructions-card');
    const membershipAmount = document.getElementById('Membership-amount');
    const membershipText = document.getElementById('Membership-text');

    if (status.is_member) {
        // Hide payment instructions
        if (instructionsCard) instructionsCard.style.display = 'none';
        if (membershipAmount) membershipAmount.style.display = 'none';
        if (membershipText) membershipText.style.display = 'none';
        

        container.innerHTML = `
            <div style="text-align:center;">
                <h2 style="color:var(--green);">🎉 Welcome, Official Member!</h2>
                <p style="font-size:1.2rem;">Your membership was approved on <strong>${new Date(status.approved_at).toLocaleDateString()}</strong>.</p>
                <p>Enjoy all the exclusive benefits listed on the left!</p>
            </div>`;
        return;
    }

    
    if (status.request && status.request.status === 'pending') {
        container.innerHTML = `<div style="text-align:center;"><h3>⏳ Verification in Progress</h3><p>UTR: <strong>${status.request.transaction_id}</strong></p><p>You'll receive an email once approved.</p></div>`;
        return;
    }
    if (status.request && status.request.status === 'rejected') {
        container.innerHTML = `<div><h3 style="color:var(--red);">❌ Rejected</h3><p>Reason: ${status.request.admin_note || 'N/A'}</p><button class="btn btn-primary" onclick="showSubmissionForm()">Resubmit</button></div>`;
        return;
    }
    showSubmissionForm();
}

function showSubmissionForm() {
    document.getElementById('membership-dynamic-content').innerHTML = `
        <h3>📝 Submit Payment Verification</h3>
        <p style="color:var(--text-secondary);">Fill in your transaction ID and upload a screenshot of the payment.</p>
        <div class="input-group"><label>Transaction ID *</label><input type="text" id="utr-input" placeholder="e.g., UPI123456789"></div>
        <div class="input-group"><label>Payment Screenshot</label><input type="file" id="screenshot-input" accept="image/*" onchange="previewScreenshot()"><img id="screenshot-preview" style="max-width:200px;display:none;margin-top:8px;"></div>
        <button class="btn btn-primary" onclick="submitPaymentProof()">Submit for Verification</button>
        <p style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">* Make sure you've completed the payment.</p>
    `;
}

function previewScreenshot() {
    const file = document.getElementById('screenshot-input').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('screenshot-preview').src = e.target.result;
            document.getElementById('screenshot-preview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

async function submitPaymentProof() {
    const utr = document.getElementById('utr-input').value.trim();
    if (!utr) return showToast('Please enter Transaction ID', 'error');
    const screenshotFile = document.getElementById('screenshot-input').files[0];
    let screenshotBase64 = null;
    if (screenshotFile) {
        screenshotBase64 = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(screenshotFile);
        });
    }
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const payload = { transaction_id: utr };
    if (screenshotBase64) payload.screenshot = screenshotBase64;
    const res = await fetch('/api/membership/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (res.ok) {
        showToast('Submitted!', 'success');
        loadMembershipStatus();
    } else {
        showToast(result.error || 'Error', 'error');
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', init);
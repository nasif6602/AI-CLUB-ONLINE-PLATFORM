// admin-page.js – standalone admin panel for membership requests



async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
        window.location.href = '/';
        return;
    }
    currentUser = session.user;

    // Verify admin role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
    if (!profile || profile.role !== 'admin') {
        showToast('You are not an admin', 'error');
        setTimeout(() => window.location.href = '/', 2000);
        return;
    }

    document.getElementById('admin-user-info').innerText = `Admin: ${currentUser.email}`;
    loadStats();
    loadMembershipRequests();
}

async function loadStats() {
    const { count: membersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
    const { count: projectsCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    document.getElementById('admin-stat-members').textContent = membersCount || 0;
    document.getElementById('admin-stat-events').textContent = eventsCount || 0;
    document.getElementById('admin-stat-projects').textContent = projectsCount || 0;
}

async function loadMembershipRequests() {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch('/api/admin/membership-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
        document.getElementById('admin-membership-requests').innerHTML = '<p style="color:var(--red);">Failed to load requests.</p>';
        return;
    }
    const requests = await res.json();
    const container = document.getElementById('admin-membership-requests');
    if (!requests.length) {
        container.innerHTML = '<p style="color:var(--text-muted);">No membership requests.</p>';
        return;
    }

    container.innerHTML = requests.map(req => `
        <div style="padding:12px;border-bottom:1px solid var(--border);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                <div>
                    <strong>${req.profiles?.full_name || 'Unknown'}</strong>
                    <span class="badge ${req.status === 'pending' ? 'badge-member' : (req.status === 'approved' ? 'badge-green' : 'badge-admin')}">${req.status}</span>
                    <br><small>UTR: ${req.transaction_id}</small>
                    <br><small>Email: ${req.profiles?.email || ''}</small>
                </div>
                ${req.proof_image ? `<br><img src="${req.proof_image}" style="max-width:100px;border-radius:4px;margin-top:4px;">` : ''}
                ${req.status === 'pending' ? `
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-sm btn-primary" onclick="approve('${req.id}')">✅ Approve</button>
                    <button class="btn btn-sm btn-outline" onclick="reject('${req.id}')">❌ Reject</button>
                </div>` : `<small>Reviewed on ${new Date(req.reviewed_at).toLocaleDateString()}</small>`}
            </div>
        </div>
    `).join('');
}

async function approve(requestId) {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch(`/api/admin/membership-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
        showToast('Approved! Email sent.', 'success');
        loadMembershipRequests();
    } else {
        const err = await res.json();
        showToast(err.error || 'Error', 'error');
    }
}

async function reject(requestId) {
    const note = prompt('Reason for rejection (optional):');
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const res = await fetch(`/api/admin/membership-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ note })
    });
    if (res.ok) {
        showToast('Rejected', 'success');
        loadMembershipRequests();
    } else {
        const err = await res.json();
        showToast(err.error || 'Error', 'error');
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', init);
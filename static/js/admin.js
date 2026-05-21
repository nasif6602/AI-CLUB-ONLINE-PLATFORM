// Admin panel functions

function refreshAdmin() {
    document.getElementById('admin-stat-members').textContent = allMembers.length;
    document.getElementById('admin-stat-events').textContent = allEvents.length;
    document.getElementById('admin-stat-projects').textContent = allProjects.length;
    document.getElementById('admin-members-list').innerHTML = allMembers.map(m => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
            <div><strong>${m.full_name}</strong> <span class="badge ${m.role==='admin'?'badge-admin':'badge-member'}">${m.role}</span><br><small>${m.email}</small></div>
            <button class="btn btn-sm ${m.role==='admin'?'btn-outline':'btn-primary'}" onclick="toggleAdminRole('${m.id}','${m.role}')">${m.role==='admin'?'Remove Admin':'Make Admin'}</button>
        </div>`).join('');
}

async function toggleAdminRole(userId, currentRole) {
    if (!userProfile || userProfile.role !== 'admin') return;
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) return showToast('Error updating role', 'error');
    showToast('Role updated', 'success');
    await loadMembers();
    refreshAdmin();
}
// Data loading and rendering for all non‑blog sections
let currentEventFilter = 'upcoming';   // default: show upcoming only
async function loadMembers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) allMembers = data;
}

async function loadEvents() {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    if (data) allEvents = data;
}

async function loadResources() {
    const { data } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
    if (data) allResources = data;
}

async function loadProjects() {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (data) allProjects = data;
}

async function loadAnnouncements() {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (data) allAnnouncements = data;
}

async function loadAllData() {
    await Promise.all([loadMembers(), loadEvents(), loadResources(), loadProjects(), loadAnnouncements()]);
    await loadBlogs();
    refreshDashboard();
}

function updateUIForUser() {
    const name = userProfile?.full_name || currentUser?.email?.split('@')[0] || 'User';
    const initial = name.charAt(0).toUpperCase();
    document.getElementById('sidebar-avatar').textContent = initial;
    document.getElementById('sidebar-username').textContent = name;
    document.getElementById('sidebar-userrole').textContent = userProfile?.role === 'admin' ? 'Admin' : 'Member';
    document.getElementById('dash-username').textContent = name;
    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-email').textContent = currentUser?.email || '';
    document.getElementById('profile-bio').textContent = userProfile?.bio || 'No bio';
    document.getElementById('profile-role-badge').textContent = userProfile?.role === 'admin' ? 'Admin' : 'Member';
    document.getElementById('profile-role-badge').className = userProfile?.role === 'admin' ? 'badge badge-admin' : 'badge badge-member';
    document.getElementById('profile-branch').textContent = userProfile?.branch || '';
    document.getElementById('profile-year').textContent = userProfile?.year || '';
    document.getElementById('profile-skills').innerHTML = (userProfile?.skills || []).map(s => `<span class="tech-tag">${s}</span>`).join('') || '<span style="color:var(--text-muted);">No skills</span>';
    document.getElementById('profile-avatar-lg').textContent = initial;
}

function refreshDashboard() {
    document.getElementById('stat-members').textContent = allMembers.length;
    document.getElementById('stat-events').textContent = allEvents.length;
    document.getElementById('stat-projects').textContent = allProjects.length;
    document.getElementById('stat-resources').textContent = allResources.length;

    const today = new Date();
    document.getElementById('today-date').textContent = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const recentAnn = allAnnouncements.slice(0, 3);
    document.getElementById('dash-announcements').innerHTML = recentAnn.length ? recentAnn.map(a => `<div style="padding:8px 0;border-bottom:1px solid var(--border);"><strong>📌 ${a.title}</strong><p style="font-size:0.8rem;color:var(--text-muted);">${a.description?.substring(0,80)}...</p></div>`).join('') : '<p style="color:var(--text-muted);">No announcements</p>';

    const upcoming = allEvents.filter(e => new Date(e.event_date) >= new Date()).slice(0, 3);
    document.getElementById('dash-events').innerHTML = upcoming.length ? upcoming.map(e => {
        const d = new Date(e.event_date);
        return `<div style="padding:8px 0;border-bottom:1px solid var(--border);display:flex;gap:10px;"><div style="background:var(--bg-tertiary);border-radius:8px;padding:6px 10px;text-align:center;min-width:45px;"><strong style="color:var(--accent);">${d.getDate()}</strong><br><small>${d.toLocaleString('default',{month:'short'})}</small></div><div><strong>${e.title}</strong><p style="font-size:0.8rem;color:var(--text-muted);">${e.location||''}</p></div></div>`;
    }).join('') : '<p style="color:var(--text-muted);">No upcoming events</p>';

    // Today's blogs feed and recent blogs are handled in blog.js to avoid duplication
    // They are called from refreshDashboard() after all data is loaded.
    renderTodayBlogs();
    renderRecentBlogs();
}

function renderMembers() {
    const search = document.getElementById('member-search')?.value.trim().toLowerCase() || '';
    const filtered = allMembers.filter(m =>
        m.full_name?.toLowerCase().includes(search) ||
        m.email?.toLowerCase().includes(search) ||
        (m.skills || []).some(s => s.toLowerCase().includes(search))
    );
    document.getElementById('members-grid').innerHTML = filtered.map(m => `
        <div class="card" style="text-align:center;">
            <div style="width:60px;height:60px;border-radius:50%;background:var(--accent-gradient);display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;margin:0 auto 10px;">${m.full_name?.charAt(0) || '?'}</div>
            <h4>${m.full_name}</h4>
            <span class="badge ${m.role === 'admin' ? 'badge-admin' : 'badge-member'}">${m.role}</span>
            <p style="font-size:0.85rem;color:var(--text-secondary);">${m.branch || ''} ${m.year || ''}</p>
            <div style="margin-top:8px;">${(m.skills || []).slice(0, 3).map(s => `<span class="tech-tag">${s}</span>`).join('')}</div>
            <button class="btn btn-sm btn-outline" style="margin-top:12px;" onclick="viewMemberProfile('${m.id}')">👤 View Profile</button>
        </div>
    `).join('') || '<p style="color:var(--text-muted);">No members found</p>';
}

function viewMemberProfile(memberId) {
    const member = allMembers.find(m => m.id === memberId);
    if (!member) return;

    // Collect member's blogs, resources, projects
    const memberBlogs = allBlogs.filter(b => b.author_id === memberId);
    const memberResources = allResources.filter(r => r.uploaded_by === memberId);
    const memberProjects = allProjects.filter(p => p.created_by === memberId);

    // Build modal content
    const modalContent = `
        <div style="text-align:center;margin-bottom:20px;">
            <div style="width:80px;height:80px;border-radius:50%;background:var(--accent-gradient);display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;color:#fff;margin:0 auto 10px;">${member.full_name?.charAt(0) || '?'}</div>
            <h2>${member.full_name}</h2>
            <p style="color:var(--text-secondary);">${member.email}</p>
            ${member.bio ? `<p style="margin-top:8px;color:var(--text-muted);">${member.bio}</p>` : ''}
            <div style="margin-top:8px;">
                <span class="badge ${member.role === 'admin' ? 'badge-admin' : 'badge-member'}">${member.role}</span>
                ${member.branch ? `<span class="badge" style="background:var(--bg-tertiary);">${member.branch}</span>` : ''}
                ${member.year ? `<span class="badge" style="background:var(--bg-tertiary);">${member.year}</span>` : ''}
            </div>
            <div style="margin-top:8px;">${(member.skills || []).map(s => `<span class="tech-tag">${s}</span>`).join('') || '<span style="color:var(--text-muted);">No skills</span>'}</div>
        </div>

        <!-- Tabs for member's content -->
        <div style="display:flex;gap:8px;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:8px;">
            <button class="btn btn-sm btn-primary member-tab-btn" data-tab="blogs" onclick="switchMemberTab('blogs', this)">📝 Blogs (${memberBlogs.length})</button>
            <button class="btn btn-sm btn-outline member-tab-btn" data-tab="resources" onclick="switchMemberTab('resources', this)">📚 Resources (${memberResources.length})</button>
            <button class="btn btn-sm btn-outline member-tab-btn" data-tab="projects" onclick="switchMemberTab('projects', this)">🚀 Projects (${memberProjects.length})</button>
        </div>

        <div id="member-tab-content">
            <!-- Dynamic tab content -->
        </div>
    `;

    // Store data for later tab switching
    window._memberProfileData = { member, memberBlogs, memberResources, memberProjects };

    // Show modal
    document.getElementById('modal-container').innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
            <div class="modal" style="max-width:850px;max-height:90vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h3 style="margin:0;">Member Profile</h3>
                    <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button>
                </div>
                ${modalContent}
            </div>
        </div>`;

    // Show blogs tab by default
    switchMemberTab('blogs', document.querySelector('.member-tab-btn[data-tab="blogs"]'));
}

function switchMemberTab(tab, btnElement) {
    if (!window._memberProfileData) return;

    // Update button styles
    document.querySelectorAll('.member-tab-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline');
    });
    btnElement.classList.remove('btn-outline');
    btnElement.classList.add('btn-primary');

    const container = document.getElementById('member-tab-content');
    if (!container) return;

    const { memberBlogs, memberResources, memberProjects } = window._memberProfileData;

    switch (tab) {
        case 'blogs':
            container.innerHTML = memberBlogs.length ? memberBlogs.map(blog => `
                <div class="card" style="margin-bottom:8px;cursor:pointer;" onclick="viewBlog('${blog.id}')">
                    <h4 style="margin:0; font-size:1.15rem; font-weight:600; color:var(--text-primary, #0f172a); line-height:1.4;">${blog.title}</h4>
                    <p class="blog-excerpt"style="margin:0; font-size:0.875rem; color:var(--text-secondary, #475569); line-height:1.6; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${blog.excerpt || blog.content?.substring(0,100)}...</p>
                    <div class="blog-meta" style="display:flex; flex-wrap:wrap; gap:12px; margin-top:auto; padding-top:8px; border-top:1px solid var(--border-color, #e2e8f0); font-size:0.75rem; color:var(--text-muted, #64748b);"><span style="display:inline-flex; align-items:center; gap:18px;">❤️ ${blog.likes || 0}</span> · <span style="display:inline-flex; align-items:center; gap:18px;">👁️ ${blog.views || 0}</span> · <span style="display:inline-flex; align-items:center; gap:18px;">📅 ${new Date(blog.created_at).toLocaleDateString()}</span></div>
                </div>
            `).join('') : '<p style="color:var(--text-muted);">No blogs yet.</p>';
            break;
        case 'resources':
            container.innerHTML = memberResources.length ? memberResources.map(r => `<div class="card" style="display:flex; flex-direction:column; gap:14px; padding:18px; font-family:system-ui,-apple-system,sans-serif;">
    <span class="badge badge-green" style="align-self:flex-start; font-size:0.7rem; padding:3px 10px; border-radius:999px; background:#10b981; color:#ffffff; font-weight:600; letter-spacing:0.3px; text-transform:uppercase;">${r.category||'General'}</span>
    <h4 style="margin:0; font-size:1.05rem; font-weight:600; line-height:1.4;">${r.title}</h4>
    <p style="margin:0; font-size:0.875rem;  line-height:1.6;">${r.description?.substring(0,120)}</p>
    <a href="${r.link}" target="_blank" class="btn btn-sm btn-primary" >🔗 Open</a>
</div>`).join('') : '<p style="color:var(--text-muted);">No resources shared.</p>';
            break;
        case 'projects':
            container.innerHTML = memberProjects.length ? memberProjects.map(p => `
       
<div class="card" style="display:flex; flex-direction:column; gap:12px; padding:18px;  font-family:system-ui,-apple-system,sans-serif;">
    <h4 style="margin:0; font-size:1.1rem; font-weight:600; color:var(--text-primary, #0f172a); line-height:1.4;">🚀 ${p.title}</h4>
    <p style="margin:0; font-size:0.875rem; color:var(--text-secondary, #475569); line-height:1.6;">${p.description?.substring(0,120)}</p>
    <div style="display:flex; flex-wrap:wrap; gap:6px;">${(p.technologies||[]).map(t=>`<span class="tech-tag" style="font-size:0.7rem; padding:3px 8px; background:var(--tag-bg, #f1f5f9); color:var(--tag-text, #475569); border-radius:6px; font-weight:500; border:1px solid var(--border-color, #e2e8f0);">${t}</span>`).join('')}</div>
    <p style="margin:0; font-size:0.85rem; color:var(--text-secondary, #475569);">👥 ${p.team_members||'Solo'}</p>
    <div style="display:flex; gap:8px; flex-wrap:wrap;">${p.github_link?`<a href="${p.github_link}" class="btn btn-sm btn-outline">GitHub</a>`:''}${p.demo_link?`<a href="${p.demo_link}" class="btn btn-sm btn-primary">Demo</a>`:''}</div>
</div>`).join('') : '<p style="color:var(--text-muted);">No projects yet.</p>';
            break;
    }
}

function renderEvents() {
    const now = new Date();
    let filtered = [];

    switch (currentEventFilter) {
        case 'upcoming':
            filtered = allEvents.filter(e => new Date(e.event_date) >= now);
            break;
        case 'past':
            filtered = allEvents.filter(e => new Date(e.event_date) < now);
            break;
        case 'all':
        default:
            filtered = [...allEvents];
            break;
    }

    // Sort by date (upcoming: ascending, past: descending)
    if (currentEventFilter === 'past') {
        filtered.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
    } else {
        filtered.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    }

    const html = filtered.length > 0 ? filtered.map(e => {
        const d = new Date(e.event_date);
        const isUpcoming = d >= now;
        return `
    <div class="card event-card" style="display:flex; align-items:flex-start; gap:16px; padding:18px;font-family:system-ui,-apple-system,sans-serif;">
    <div class="event-date-badge" style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:58px; height:68px; background:linear-gradient(135deg,#3b82f6,#2563eb); border-radius:10px; box-shadow:0 2px 6px rgba(37,99,235,0.25); flex-shrink:0;">
        <div class="event-date-day" style="font-size:1.35rem; font-weight:700; line-height:1;">${d.getDate()}</div>
        <div class="event-date-month" style="font-size:0.7rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; opacity:0.9; margin-top:2px;">${d.toLocaleString('default',{month:'short'})}</div>
    </div>
    <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:8px;">
        <h4 style="margin:0; font-size:1.05rem; font-weight:600; line-height:1.4;">
            ${e.title} ${isUpcoming ? '<span class="badge badge-green" style="margin-left:8px; font-size:0.65rem; padding:2px 8px; border-radius:999px; background:#10b981; color:#fff; font-weight:500;">Upcoming</span>' : '<span class="badge" style="background:var(--bg-tertiary);color:var(--text-muted); margin-left:8px; font-size:0.65rem; padding:2px 8px; border-radius:999px;">Past</span>'}
        </h4>
        <p style="margin:0; font-size:0.875rem; color:var(--text-secondary); line-height:1.5; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${e.description?.substring(0,100) || ''}...</p>
        <p style="margin:0; font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:6px; flex-wrap:wrap;">📍 ${e.location || 'TBD'} <span style="opacity:0.5;">|</span> 🕐 ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>
        ${e.registration_link ? `<a href="${e.registration_link}" target="_blank" class="btn btn-sm btn-primary" >Register</a>` : ''}
    </div>
</div>`;
    }).join('') : '<p style="color:var(--text-muted);grid-column:1/-1;">No events found for this filter.</p>';

    document.getElementById('events-grid').innerHTML = html;
}

// New filter function for events
function filterEvents(filterType) {
    currentEventFilter = filterType;
    // Update active button styling
    document.getElementById('filter-upcoming').classList.toggle('active', filterType === 'upcoming');
    document.getElementById('filter-past').classList.toggle('active', filterType === 'past');
    document.getElementById('filter-all').classList.toggle('active', filterType === 'all');
    renderEvents();
}

function renderResources() {
    const search = document.getElementById('resource-search')?.value.toLowerCase() || '';
    let filtered = currentResourceFilter === 'all' ? allResources : allResources.filter(r => r.category === currentResourceFilter);
    if (search) filtered = filtered.filter(r => r.title?.toLowerCase().includes(search) || r.description?.toLowerCase().includes(search));
    document.getElementById('resources-grid').innerHTML = filtered.map(r => `<div class="card" style="display:flex; flex-direction:column; gap:14px; padding:18px; font-family:system-ui,-apple-system,sans-serif;">
    <span class="badge badge-green" style="align-self:flex-start; font-size:0.7rem; padding:3px 10px; border-radius:999px; background:#10b981; color:#ffffff; font-weight:600; letter-spacing:0.3px; text-transform:uppercase;">${r.category||'General'}</span>
    <h4 style="margin:0; font-size:1.05rem; font-weight:600; line-height:1.4;">${r.title}</h4>
    <p style="margin:0; font-size:0.875rem;  line-height:1.6;">${r.description?.substring(0,120)}</p>
    <a href="${r.link}" target="_blank" class="btn btn-sm btn-primary" >🔗 Open</a>
    ${(currentUser?.id === r.uploaded_by || userProfile?.role === 'admin') ? `
                <button class="btn btn-ghost btn-sm" style="position:absolute;top:12px;right:12px;" onclick="deleteResource('${r.id}')" title="Delete resource">🗑️</button>
            ` : ''}
</div>`).join('') || '<p>No resources</p>';
}

function filterResources(cat, btn) {
    currentResourceFilter = cat;
    document.querySelectorAll('#resource-categories button').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderResources();
}

function renderProjects() {
    document.getElementById('projects-grid').innerHTML = allProjects.map(p => `
       
<div class="card" style="display:flex; flex-direction:column; gap:12px; padding:18px;  font-family:system-ui,-apple-system,sans-serif;">
    <h4 style="margin:0; font-size:1.1rem; font-weight:600; color:var(--text-primary, #0f172a); line-height:1.4;">🚀 ${p.title}</h4>
    <p style="margin:0; font-size:0.875rem; color:var(--text-secondary, #475569); line-height:1.6;">${p.description?.substring(0,120)}</p>
    <div style="display:flex; flex-wrap:wrap; gap:6px;">${(p.technologies||[]).map(t=>`<span class="tech-tag" style="font-size:0.7rem; padding:3px 8px; background:var(--tag-bg, #f1f5f9); color:var(--tag-text, #475569); border-radius:6px; font-weight:500; border:1px solid var(--border-color, #e2e8f0);">${t}</span>`).join('')}</div>
    <p style="margin:0; font-size:0.85rem; color:var(--text-secondary, #475569);">👥 ${p.team_members||'Solo'}</p>
    <div style="display:flex; gap:8px; flex-wrap:wrap;">${p.github_link?`<a href="${p.github_link}" class="btn btn-sm btn-outline">GitHub</a>`:''}${p.demo_link?`<a href="${p.demo_link}" class="btn btn-sm btn-primary">Demo</a>`:''}</div>
    ${(currentUser?.id === p.created_by || userProfile?.role === 'admin') ? `
                <button class="btn btn-ghost btn-sm" style="position:absolute;top:12px;right:12px;" onclick="deleteProject('${p.id}')" title="Delete project">🗑️</button>
            ` : ''}
</div>`).join('') || '<p>No projects</p>';
}

// delete resources and projects
async function deleteResource(id) {
    if (!confirm('Delete this resource?')) return;
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) {
        showToast('Error deleting: ' + error.message, 'error');
        return;
    }
    showToast('Resource deleted', 'success');
    await loadResources();
    renderResources();
}

async function deleteProject(id) {
    if (!confirm('Delete this project?')) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
        showToast('Error deleting: ' + error.message, 'error');
        return;
    }
    showToast('Project deleted', 'success');
    await loadProjects();
    renderProjects();
}


function renderAnnouncements() {
    const container = document.getElementById('announcements-list');
    if (!container) return;

    if (!allAnnouncements || allAnnouncements.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);">No announcements yet.</p>';
        return;
    }

    container.innerHTML = allAnnouncements.map(a => `
        <div class="card" style="margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <span class="badge badge-admin">📌</span>
                <strong>${a.title}</strong>
                <small style="color:var(--text-muted);margin-left:auto;">${new Date(a.created_at).toLocaleDateString()}</small>
                ${userProfile?.role === 'admin' ? `
                    <button class="btn btn-ghost btn-sm" style="margin-left:8px;" onclick="deleteAnnouncement('${a.id}')" title="Delete announcement">🗑️</button>
                ` : ''}
            </div>
            <p style="color:var(--text-secondary);">${a.description || ''}</p>
        </div>
    `).join('');
}

async function deleteAnnouncement(id) {
    if (!confirm('Delete this announcement?')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
        showToast('Error deleting: ' + error.message, 'error');
        return;
    }
    showToast('Announcement deleted', 'success');
    await loadAnnouncements();
    renderAnnouncements();
    // Also refresh dashboard if it's open (optional)
    if (typeof refreshDashboard === 'function') refreshDashboard();
}

// Modals for creating content (events, resources, projects, announcements, profile)
function showCreateEventModal() {
    showModal('Create Event', `
        <div class="input-group"><label>Title</label><input type="text" id="event-title"></div>
        <div class="input-group"><label>Description</label><textarea id="event-desc"></textarea></div>
        <div class="input-group"><label>Date & Time</label><input type="datetime-local" id="event-date"></div>
        <div class="input-group"><label>Location</label><input type="text" id="event-location"></div>
        <div class="input-group"><label>Registration Link</label><input type="url" id="event-link"></div>
    `, async () => {
        const event = {
            title: document.getElementById('event-title').value.trim(),
            description: document.getElementById('event-desc').value.trim(),
            event_date: document.getElementById('event-date').value,
            location: document.getElementById('event-location').value.trim(),
            registration_link: document.getElementById('event-link').value.trim(),
            created_at: new Date().toISOString()
        };
        if (!event.title || !event.event_date) return showToast('Title and date required', 'error');
        const { error } = await supabase.from('events').insert(event);
        if (error) return showToast('Error creating event', 'error');
        showToast('Event created!', 'success');
        await loadEvents(); renderEvents();
    });
}

function showCreateAnnouncementModal() {
    showModal('New Announcement', `
        <div class="input-group"><label>Title</label><input type="text" id="ann-title"></div>
        <div class="input-group"><label>Description</label><textarea id="ann-desc"></textarea></div>
    `, async () => {
        console.log('=== Save callback started ===');
        try {
            const title = document.getElementById('ann-title').value.trim();
            const description = document.getElementById('ann-desc').value.trim();
            if (!title) {
                showToast('Title is required', 'error');
                console.log('No title, abort');
                return;
            }
            console.log('Title:', title);

            // Get the access token
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;
            console.log('Have token:', !!token);

            if (!token) {
                showToast('Not authenticated', 'error');
                return;
            }

            const payload = {
                title,
                description,
                created_by: currentUser.id,
                created_at: new Date().toISOString()
            };
            console.log('Payload:', payload);

            // Try using raw fetch directly (bypass supabase-js if needed)
            const response = await fetch('https://lavhhlenhvziuwhgbcjb.supabase.co/rest/v1/announcements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhdmhobGVuaHZ6aXV3aGdiY2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTI0MzgsImV4cCI6MjA5MTIyODQzOH0._id3VTQwA_voRcNoA3qBIiCmsGpQB1pyymKn_Uiz3QU',
                    'Authorization': `Bearer ${token}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload)
            });
            console.log('Response status:', response.status);
            const body = await response.text();
            console.log('Response body:', body);

            if (response.ok) {
                showToast('Announcement posted! 📢', 'success');
                await loadAnnouncements();
                renderAnnouncements();
            } else {
                showToast('Error posting: ' + body, 'error');
            }
        } catch (err) {
            console.error('Exception in save:', err);
            showToast('Something went wrong', 'error');
        }
        console.log('=== Save callback finished ===');
    });
}
function showAddResourceModal() {
    showModal('Add Resource', `
        <div class="input-group"><label>Title</label><input type="text" id="res-title"></div>
        <div class="input-group"><label>Category</label><select id="res-category">
            <option>Machine Learning</option><option>Deep Learning</option><option>Python</option><option>Web Development</option><option>DSA</option><option>Research Papers</option>
        </select></div>
        <div class="input-group"><label>Link</label><input type="url" id="res-link"></div>
        <div class="input-group"><label>Description</label><textarea id="res-desc"></textarea></div>
    `, async () => {
        const title = document.getElementById('res-title').value.trim();
        const category = document.getElementById('res-category').value;
        const link = document.getElementById('res-link').value.trim();
        const desc = document.getElementById('res-desc').value.trim();

        if (!title || !link) {
            showToast('Title and link are required', 'error');
            return;
        }

        // Build payload only with existing columns
        const res = {
            title,
            category,
            link,
            description: desc,
            uploaded_by: currentUser.id,
            created_at: new Date().toISOString()
        };

        console.log('Saving resource:', res);

        try {
            const { error } = await supabase.from('resources').insert(res);
            if (error) {
                console.error('Insert error:', error);
                showToast('Error adding resource: ' + error.message, 'error');
            } else {
                showToast('Resource added!', 'success');
                await loadResources();
                renderResources();
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            showToast('Something went wrong', 'error');
        }
    });
}

function showAddProjectModal() {
    showModal('Add Project', `
        <div class="input-group"><label>Title</label><input type="text" id="proj-title"></div>
        <div class="input-group"><label>Description</label><textarea id="proj-desc"></textarea></div>
        <div class="input-group"><label>Technologies (comma separated)</label><input type="text" id="proj-tech" placeholder="Python, TensorFlow, React"></div>
        <div class="input-group"><label>GitHub Link</label><input type="url" id="proj-github"></div>
        <div class="input-group"><label>Demo Link</label><input type="url" id="proj-demo"></div>
        <div class="input-group"><label>Team Members</label><input type="text" id="proj-team" placeholder="John, Jane"></div>
    `, async () => {
        const title = document.getElementById('proj-title').value.trim();
        const desc = document.getElementById('proj-desc').value.trim();
        const techString = document.getElementById('proj-tech').value.trim();
        const github = document.getElementById('proj-github').value.trim();
        const demo = document.getElementById('proj-demo').value.trim();
        const team = document.getElementById('proj-team').value.trim();

        if (!title) {
            showToast('Title is required', 'error');
            return;
        }

        // Convert technologies to an array
        const technologies = techString ? techString.split(',').map(s => s.trim()).filter(Boolean) : [];

        const proj = {
            title,
            description: desc,
            technologies,
            github_link: github,
            demo_link: demo,
            team_members: team,
            created_by: currentUser.id,
            created_at: new Date().toISOString()
        };

        console.log('Saving project:', proj);

        try {
            const { error } = await supabase.from('projects').insert(proj);
            if (error) {
                console.error('Insert error:', error);
                showToast('Error adding project: ' + error.message, 'error');
            } else {
                showToast('Project added! 🚀', 'success');
                await loadProjects();
                renderProjects();
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            showToast('Something went wrong', 'error');
        }
    });
}

function showEditProfileModal() {
    showModal('Edit Profile', `
        <div class="input-group"><label>Name</label><input type="text" id="edit-name" value="${userProfile?.full_name||''}"></div>
        <div class="input-group"><label>Branch</label><input type="text" id="edit-branch" value="${userProfile?.branch||''}"></div>
        <div class="input-group"><label>Year</label><select id="edit-year">${['1st','2nd','3rd','4th'].map(y=>`<option value="${y}" ${userProfile?.year===y?'selected':''}>${y}</option>`).join('')}</select></div>
        <div class="input-group"><label>Bio</label><textarea id="edit-bio">${userProfile?.bio||''}</textarea></div>
        <div class="input-group"><label>Skills (comma separated)</label><input type="text" id="edit-skills" value="${(userProfile?.skills||[]).join(', ')}"></div>
    `, async () => {
        const updates = {
            full_name: document.getElementById('edit-name').value.trim(),
            branch: document.getElementById('edit-branch').value.trim(),
            year: document.getElementById('edit-year').value,
            bio: document.getElementById('edit-bio').value.trim(),
            skills: document.getElementById('edit-skills').value.split(',').map(s=>s.trim()).filter(Boolean)
        };
        const { error } = await supabase.from('profiles').update(updates).eq('id', currentUser.id);
        if (error) return showToast('Update failed', 'error');
        userProfile = { ...userProfile, ...updates };
        updateUIForUser();
        await loadMembers();
        showToast('Profile updated!', 'success');
    });
}


// ==================== Profile Tabs ====================
function loadProfileTab(tab) {
    // Update active button styling
    document.querySelectorAll('#profile-tabs button').forEach(btn => btn.classList.remove('btn-primary'));
    document.querySelectorAll('#profile-tabs button').forEach(btn => btn.classList.add('btn-outline'));
    const activeBtn = document.getElementById(`tab-${tab}`);
    if (activeBtn) {
        activeBtn.classList.remove('btn-outline');
        activeBtn.classList.add('btn-primary');
    }

    const container = document.getElementById('profile-tab-content');
    if (!container) return;

    switch (tab) {
        case 'blogs':
            renderProfileBlogs();
            break;
        case 'resources':
            renderProfileResources();
            break;
        case 'projects':
            renderProfileProjects();
            break;
    }
}

function renderProfileBlogs() {
    const container = document.getElementById('profile-tab-content');
    const userBlogs = allBlogs.filter(b => b.author_id === currentUser.id);
    if (userBlogs.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);">You haven’t written any blogs yet.</p>';
        return;
    }
    container.innerHTML = userBlogs.map(blog => `
        <div class="card" style="cursor:pointer;margin-bottom:12px;" onclick="viewBlog('${blog.id}')" style="display:flex; align-items:stretch; gap:16px; padding:18px; font-family:system-ui,-apple-system,sans-serif; cursor:pointer;">
            <h4 style="margin:0; font-size:1.15rem; font-weight:600; color:var(--text-primary, #0f172a); line-height:1.4;">${blog.title}</h4>
            <p class="blog-excerpt" style="margin:0; font-size:0.875rem; color:var(--text-secondary, #475569); line-height:1.6; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${blog.excerpt || blog.content?.substring(0,120)}...</p>
            <div class="blog-meta" style="display:flex; flex-wrap:wrap; gap:12px; margin-top:auto; padding-top:8px; border-top:1px solid var(--border-color, #e2e8f0); font-size:0.75rem; color:var(--text-muted, #64748b);">
            <span style="display:inline-flex; align-items:center; gap:18px;">
                <span style="display:inline-flex; align-items:center; gap:18px;">❤️ ${blog.likes || 0}</span>
                <span style="display:inline-flex; align-items:center; gap:18px;">👁️ ${blog.views || 0}</span>
                <span style="display:inline-flex; align-items:center; gap:18px;"> ${new Date(blog.created_at).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

function renderProfileResources() {
    const container = document.getElementById('profile-tab-content');
    const userResources = allResources.filter(r => r.uploaded_by === currentUser.id);
    if (userResources.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);">You haven’t shared any resources yet.</p>';
        return;
    }
    container.innerHTML = userResources.map(r => `<div class="card" style="display:flex; flex-direction:column; gap:14px; padding:18px; font-family:system-ui,-apple-system,sans-serif;">
    <span class="badge badge-green" style="align-self:flex-start; font-size:0.7rem; padding:3px 10px; border-radius:999px; background:#10b981; color:#ffffff; font-weight:600; letter-spacing:0.3px; text-transform:uppercase;">${r.category||'General'}</span>
    <h4 style="margin:0; font-size:1.05rem; font-weight:600; line-height:1.4;">${r.title}</h4>
    <p style="margin:0; font-size:0.875rem;  line-height:1.6;">${r.description?.substring(0,120)}</p>
    <a href="${r.link}" target="_blank" class="btn btn-sm btn-primary" >🔗 Open</a>
    ${(currentUser?.id === r.uploaded_by || userProfile?.role === 'admin') ? `
                <button class="btn btn-ghost btn-sm" style="position:absolute;top:12px;right:12px;" onclick="deleteResource('${r.id}')" title="Delete resource">🗑️</button>
            ` : ''}
</div>`).join('');
}

function renderProfileProjects() {
    const container = document.getElementById('profile-tab-content');
    const userProjects = allProjects.filter(p => p.created_by === currentUser.id);
    if (userProjects.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);">You haven’t created any projects yet.</p>';
        return;
    }
    container.innerHTML = userProjects.map(p => `
<div class="card" style="display:flex; flex-direction:column; gap:12px; padding:18px;  font-family:system-ui,-apple-system,sans-serif;">
    <h4 style="margin:0; font-size:1.1rem; font-weight:600; color:var(--text-primary, #0f172a); line-height:1.4;">🚀 ${p.title}</h4>
    <p style="margin:0; font-size:0.875rem; color:var(--text-secondary, #475569); line-height:1.6;">${p.description?.substring(0,120)}</p>
    <div style="display:flex; flex-wrap:wrap; gap:6px;">${(p.technologies||[]).map(t=>`<span class="tech-tag" style="font-size:0.7rem; padding:3px 8px; background:var(--tag-bg, #f1f5f9); color:var(--tag-text, #475569); border-radius:6px; font-weight:500; border:1px solid var(--border-color, #e2e8f0);">${t}</span>`).join('')}</div>
    <p style="margin:0; font-size:0.85rem; color:var(--text-secondary, #475569);">👥 ${p.team_members||'Solo'}</p>
    <div style="display:flex; gap:8px; flex-wrap:wrap;">${p.github_link?`<a href="${p.github_link}" class="btn btn-sm btn-outline">GitHub</a>`:''}${p.demo_link?`<a href="${p.demo_link}" class="btn btn-sm btn-primary">Demo</a>`:''}</div>
    ${(currentUser?.id === p.created_by || userProfile?.role === 'admin') ? `
                <button class="btn btn-ghost btn-sm" style="position:absolute;top:12px;right:12px;" onclick="deleteProject('${p.id}')" title="Delete project">🗑️</button>
            ` : ''}
</div>`).join('');
}
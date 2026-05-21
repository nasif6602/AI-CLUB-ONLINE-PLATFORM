// member-pages.js – Member‑only exclusive pages

let allMemberEvents = [];
let allMemberResources = [];
let allOfficialMembers = [];
let currentEventFilter = 'all';


async function initEvents() {
    await checkAuthAndMembership();
    loadMemberEvents();
}
async function initResources() {
    await checkAuthAndMembership();
    loadMemberResources();
}
async function initDirectory() {
    await checkAuthAndMembership();
    loadMemberDirectory();
}

async function checkAuthAndMembership() {
    if (typeof supabase === 'undefined') {
        document.body.innerHTML = '<p style="color:var(--red);">Supabase not loaded</p>';
        return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
        window.location.href = '/';
        return;
    }
    currentUser = session.user;

    const { data: profile } = await supabase.from('profiles').select('is_member').eq('id', currentUser.id).single();
    if (!profile || !profile.is_member) {
        document.body.innerHTML = '<div style="text-align:center;padding:40px;"><h2>🔒 Members Only</h2><p>You need to be an official member to access this page.</p><a href="/membership">Become a member</a></div>';
        return;
    }
}

// ---------- Events ----------
async function loadMemberEvents() {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    if (data) {
        allMemberEvents = data;
        renderMemberEvents();
    }
}

function renderMemberEvents() {
    let filtered = currentEventFilter === 'member_only'
        ? allMemberEvents.filter(e => e.is_member_only)
        : allMemberEvents;
    const grid = document.getElementById('member-events-grid');
    if (!filtered.length) {
        grid.innerHTML = '<p style="color:var(--text-muted);">No events found.</p>';
        return;
    }
    const now = new Date();
    grid.innerHTML = filtered.map(e => {
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
    }).join('');
}

function filterMemberEvents(type) {
    currentEventFilter = type;
    document.getElementById('filter-all-member').classList.toggle('active', type === 'all');
    document.getElementById('filter-memberonly').classList.toggle('active', type === 'member_only');
    renderMemberEvents();
}

// ---------- Resources ----------
async function loadMemberResources() {
    const { data } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
    if (data) {
        allMemberResources = data;
        renderMemberResources();
    }
}

function renderMemberResources() {
    let filtered = currentResourceFilter === 'member_only'
        ? allMemberResources.filter(r => r.is_member_only)
        : allMemberResources;
    const grid = document.getElementById('member-resources-grid');
    if (!filtered.length) {
        grid.innerHTML = '<p style="color:var(--text-muted);">No resources found.</p>';
        return;
    }
    grid.innerHTML = filtered.map(r => `
        <div class="card" style="display:flex; flex-direction:column; gap:14px; padding:18px; font-family:system-ui,-apple-system,sans-serif;">
    <span class="badge badge-green" style="align-self:flex-start; font-size:0.7rem; padding:3px 10px; border-radius:999px; background:#10b981; color:#ffffff; font-weight:600; letter-spacing:0.3px; text-transform:uppercase;">${r.category||'General'}</span>
    <h4 style="margin:0; font-size:1.05rem; font-weight:600; line-height:1.4;">${r.title}</h4>
    <p style="margin:0; font-size:0.875rem;  line-height:1.6;">${r.description?.substring(0,120)}</p>
    <a href="${r.link}" target="_blank" class="btn btn-sm btn-primary" >🔗 Open</a>
</div>`).join('');
}

function filterMemberResources(type) {
    currentResourceFilter = type;
    document.getElementById('filter-all-res').classList.toggle('active', type === 'all');
    document.getElementById('filter-memberonly-res').classList.toggle('active', type === 'member_only');
    renderMemberResources();
}

// ---------- Directory ----------
async function loadMemberDirectory() {
    const { data } = await supabase.from('profiles')
        .select('full_name, email, branch, year, skills, bio')
        .eq('is_member', true)
        .order('full_name');
    if (data) {
        allOfficialMembers = data;
        renderMemberDirectory();
    }
}

function renderMemberDirectory() {
    const search = document.getElementById('member-directory-search')?.value.toLowerCase() || '';
    let filtered = allOfficialMembers.filter(m =>
        m.full_name?.toLowerCase().includes(search) ||
        m.email?.toLowerCase().includes(search) ||
        (m.skills || []).some(s => s.toLowerCase().includes(search))
    );
    const grid = document.getElementById('member-directory-grid');
    if (!filtered.length) {
        grid.innerHTML = '<p style="color:var(--text-muted);">No members found.</p>';
        return;
    }
    grid.innerHTML = filtered.map(m => `
        <div class="card" style="text-align:center;">
            <div style="width:60px;height:60px;border-radius:50%;background:var(--accent-gradient);display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;color:#fff;margin:0 auto 10px;">${m.full_name?.charAt(0).toUpperCase() || '?'}</div>
            <h4>${m.full_name}</h4>
            <p style="font-size:0.85rem;color:var(--text-secondary);">${m.email}</p>
            <p style="font-size:0.8rem;">${m.branch || ''} ${m.year || ''}</p>
            <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-top:6px;">${(m.skills||[]).slice(0,3).map(s => `<span class="tech-tag">${s}</span>`).join('')}</div>
        </div>`).join('');
}

// Common logout
async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
}

// Auto‑init based on page
if (window.location.pathname.includes('/member-events')) document.addEventListener('DOMContentLoaded', initEvents);
if (window.location.pathname.includes('/member-resources')) document.addEventListener('DOMContentLoaded', initResources);
if (window.location.pathname.includes('/member-directory')) document.addEventListener('DOMContentLoaded', initDirectory);
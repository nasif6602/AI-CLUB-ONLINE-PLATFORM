// app.js – Hash-based routing + original features preserved

function navigateTo(pageName, addToHistory = true) {
    closeModal();   // <-- add this line

    // … rest of your existing navigateTo code …

    // Remove active class from all pages / nav links
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('#mobile-nav a').forEach(a => a.classList.remove('active'));

    // Activate the target page
    const pageEl = document.getElementById('page-' + pageName);
    if (pageEl) pageEl.classList.add('active');

    // Highlight the correct nav links
    const sLink = document.querySelector(`#sidebar-nav a[data-page="${pageName}"]`);
    if (sLink) sLink.classList.add('active');
    const mLink = document.querySelector(`#mobile-nav a[data-page="${pageName}"]`);
    if (mLink) mLink.classList.add('active');

    // Close mobile sidebar
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('active');
    }

    // Push a new history state (only when user clicks, not on back/forward)
    if (addToHistory) {
        history.pushState({ page: pageName }, '', `#${pageName}`);
    }

    // Load data for the chosen page
    if (pageName === 'dashboard') refreshDashboard();
    if (pageName === 'members') renderMembers();
    if (pageName === 'events') {
    currentEventFilter = 'upcoming';
    renderEvents();
}
    if (pageName === 'resources') renderResources();
    if (pageName === 'projects') renderProjects();
    if (pageName === 'announcements') renderAnnouncements();
    if (pageName === 'blogs') { loadBlogs(); renderBlogs(); }
    if (pageName === 'admin') refreshAdmin();
    if (pageName === 'profile') {
    updateUIForUser();
    loadProfileTab('blogs');  // <-- add this line
}

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page) {
        navigateTo(event.state.page, false);   // false = don't push again
    } else {
        // Fallback to dashboard if no state
        navigateTo('dashboard', false);
    }
});

// Main initialisation
document.addEventListener('DOMContentLoaded', async () => {
    // --- Supabase & session check (your original code) ---
    if (!supabase) {
        document.getElementById('loading-screen').classList.add('hidden');
        showToast('Supabase connection failed', 'error');
        showAuth('login');
        return;
    }
    try { await checkSession(); } catch (e) {
        document.getElementById('loading-screen').classList.add('hidden');
        showToast('Session error', 'error');
        showAuth('login');
        return;
    }
    document.getElementById('loading-screen').classList.add('hidden');

    // Auth state listener
    if (supabase && supabase.auth) {
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                currentUser = session.user;
                await loadUserProfile();
                showApp();
            }
            if (event === 'SIGNED_OUT') {
                currentUser = null; userProfile = null;
                showAuth('login');
            }
        });
    }

document.querySelectorAll('#sidebar-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        if (link.dataset.page) {
            e.preventDefault();
            navigateTo(link.dataset.page, true);
        }
        // links without data-page (like /membership) will follow the href normally
    });
});

document.querySelectorAll('#mobile-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        if (link.dataset.page) {
            e.preventDefault();
            navigateTo(link.dataset.page, true);
        }
    });
});
    // Close modals on Escape
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // --- Theme ---
    const savedTheme = localStorage.getItem('ai-club-theme');
    if (savedTheme === 'light') {
        isDarkMode = false;
        document.body.classList.add('light-mode');
        document.getElementById('theme-toggle-btn').textContent = '☀️ Light Mode';
    }

    // --- Handle initial URL hash ---
    const hash = window.location.hash.substring(1);   // remove '#'
    if (hash && document.getElementById('page-' + hash)) {
        // Replace the initial state so back button doesn't go to an empty hash
        history.replaceState({ page: hash }, '', `#${hash}`);
        navigateTo(hash, false);
    } else {
        // Default to dashboard
        history.replaceState({ page: 'dashboard' }, '', '#dashboard');
        navigateTo('dashboard', false);
    }
});
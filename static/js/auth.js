// Authentication functions

async function checkSession() {
    if (!supabase || !supabase.auth) {
        showAuth('login');
        return;
    }
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session && session.user) {
        currentUser = session.user;
        await loadUserProfile();
        showApp();
    } else {
        showAuth('login');
    }
}

async function loadUserProfile() {
    if (!currentUser) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    if (data) {
        userProfile = data;
    } else {
        const newProf = {
            id: currentUser.id,
            full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email,
            branch: '', year: '', skills: [], bio: '', role: 'member', created_at: new Date().toISOString()
        };
        const { data: created } = await supabase.from('profiles').insert(newProf).select().single();
        userProfile = created || newProf;
    }
}

function showApp() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    updateUIForUser();
    navigateTo('dashboard');
    loadAllData();
    loadBlogs();
    if (userProfile && userProfile.role === 'admin') {
        document.getElementById('admin-nav-link').style.display = '';
        document.getElementById('create-event-btn').style.display = '';
        document.getElementById('create-announcement-btn').style.display = '';
        document.getElementById('admin-nav-link').style.display = '';
        
    const adminLink = document.getElementById('admin-portal-link');
    if (adminLink) adminLink.style.display = '';
    // mobile admin link if you added one
    const mobileAdminLink = document.getElementById('mobile-admin-link');
    if (mobileAdminLink) mobileAdminLink.style.display = '';

    }
    // … existing code to show app, update UI, etc.
    if (userProfile) {
        // Show member exclusive links if is_member
        const memberLinks = document.getElementById('member-exclusive-links');
        if (memberLinks) {
            memberLinks.style.display = userProfile.is_member ? '' : 'none';
        }
        const mobileMemberLinks = document.getElementById('member-exclusive-mobile-links');
        if (mobileMemberLinks) {
            mobileMemberLinks.style.display = userProfile.is_member ? '' : 'none';
        }
        // Admin link as before
        if (userProfile.role === 'admin') {
            document.getElementById('admin-nav-link').style.display = '';
            // …
        }
    }
}
    


function showAuth(formType = 'login') {
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('auth-container').style.display = '';
    showAuthForm(formType);
}

function showAuthForm(type) {
    document.getElementById('auth-login-form').style.display = type === 'login' ? '' : 'none';
    document.getElementById('auth-register-form').style.display = type === 'register' ? '' : 'none';
    document.getElementById('auth-forgot-form').style.display = type === 'forgot' ? '' : 'none';
}

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) return showToast('Fill all fields', 'error');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return showToast(error.message, 'error');
    currentUser = data.user;
    await loadUserProfile();
    showApp();
    showToast('Welcome! 🎉', 'success');
}

async function handleRegister() {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    if (!name || !email || !password) return showToast('Fill all fields', 'error');
    if (password.length < 6) return showToast('Password min 6 chars', 'error');
    const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name } }
    });
    if (error) return showToast(error.message, 'error');
    if (data.user) {
        currentUser = data.user;
        await loadUserProfile();
        showApp();
        showToast('Account created! 🚀', 'success');
    } else {
        showToast('Check email to verify', 'info');
    }
}

async function signInWithGithub() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
            redirectTo: window.location.origin + '/'   // explicit redirect back to our app
        }
    });
    if (error) showToast(error.message, 'error');
}

async function signInWithFacebook() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
            redirectTo: window.location.origin + '/'
        }
    });
    if (error) showToast(error.message, 'error');
}

async function handleForgotPassword() {
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) return showToast('Enter email', 'error');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' });
    if (error) return showToast(error.message, 'error');
    showToast('Reset link sent! 📧', 'success');
    showAuthForm('login');
}

async function handleLogout() {
    await supabase.auth.signOut();
    currentUser = null;
    userProfile = null;
    showAuth('login');
    showToast('Logged out', 'info');
}
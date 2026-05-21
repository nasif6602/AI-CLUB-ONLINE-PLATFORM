// Utility functions: Toast, Modals, Navigation, Theme

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 3500);
}

let lastModalTime = 0;

function showModal(title, content, onSave) {
    const now = Date.now();
    if (now - lastModalTime < 500) return;   // block rapid re‑opens
    lastModalTime = now;

    closeModal();   // clear any previous modal first

    const container = document.getElementById('modal-container');
    const modalId = 'modal-save-' + now;

    container.innerHTML = `
        <div class="modal-overlay" id="modal-overlay-unique" onclick="if(event.target===this)closeModal()">
            <div class="modal">
                <div style="display:flex;justify-content:space-between;">
                    <h3>${title}</h3>
                    <button class="btn btn-ghost btn-sm" type="button" onclick="closeModal()">✕</button>
                </div>
                ${content}
                <button class="btn btn-primary" style="width:100%;margin-top:12px;" id="${modalId}" type="button">Save</button>
            </div>
        </div>`;

    const saveBtn = document.getElementById(modalId);
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            try {
                await onSave();
            } finally {
                closeModal();
            }
        });
    }
}

function closeModal() {
    document.getElementById('modal-container').innerHTML = '';
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    
    // Toggle dark-mode class (matches your CSS)
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.documentElement.classList.toggle('dark-mode', isDarkMode);
    
    // Set data-theme attribute (matches your CSS)
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    
    // Update button text
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        btn.textContent = isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode';
    }
    
    // Save to localStorage
    localStorage.setItem('ai-club-theme', isDarkMode ? 'dark' : 'light');
}

// Initialize theme on page load
function initTheme() {
    const savedTheme = localStorage.getItem('ai-club-theme');
    
    if (savedTheme === 'dark') {
        isDarkMode = true;
        document.body.classList.add('dark-mode');
        document.documentElement.classList.add('dark-mode');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.setAttribute('data-theme', 'dark');
    } else {
        isDarkMode = false;
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.setAttribute('data-theme', 'light');
    }
    
    // Update button text on load
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        btn.textContent = isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode';
    }
}

// Run on page load
initTheme();
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👁️' : '🙈';
}

// Navigation is defined in app.js to avoid circular dependencies
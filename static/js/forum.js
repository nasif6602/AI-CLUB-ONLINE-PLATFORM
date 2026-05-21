
let activeThreadId = null;
let allThreads = [];
let realtimeSubscription = null;
let pollingInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { window.location.href = '/'; return; }
    currentUser = session.user;
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', currentUser.id).single();
    userProfile = profile || { full_name: currentUser.email.split('@')[0] };
    loadThreads();
});

// ---------- Threads ----------
async function loadThreads() {
    const { data } = await supabase.from('forum_threads').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    allThreads = data || [];
    renderThreads();
}

function renderThreads() {
    const container = document.getElementById('threads-list');
    container.innerHTML = allThreads.length ? allThreads.map(t => `
        <div class="thread-item ${t.id === activeThreadId ? 'active' : ''}" onclick="openThread('${t.id}')">
            <div class="title">${t.is_pinned ? '📌 ' : ''}${t.title}</div>
            <div class="meta">${t.category} · by ${t.author_name} · ${new Date(t.created_at).toLocaleDateString()}</div>
        </div>`).join('') : '<p style="color:var(--text-muted);">No threads yet.</p>';
}

// ---------- Open / Close Thread ----------
async function openThread(threadId) {
    stopPolling();
    unsubscribeFromThread();
    activeThreadId = threadId;
    renderThreads();
    document.getElementById('message-input-area').style.display = 'flex';
    const thread = allThreads.find(t => t.id === threadId);
    document.getElementById('chat-header').innerHTML = `
        <span>${thread?.title || 'Thread'}</span>
        <div style="display:flex;gap:8px;">
            ${(currentUser?.id === thread?.author_id || userProfile?.role === 'admin') ? `<button class="btn btn-sm btn-ghost" onclick="deleteThread('${threadId}')">🗑️</button>` : ''}
            <button class="btn btn-sm btn-ghost" onclick="closeThread()">✕</button>
        </div>`;
    await loadMessages(threadId);
    subscribeToThread(threadId);       // attempt realtime
    startPolling(threadId);           // always poll as backup
}

function closeThread() {
    // 1. Immediately stop all incoming data sources
    stopPolling();
    unsubscribeFromThread();

    // 2. Now safe to clear the active thread
    activeThreadId = null;

    // 3. Reset the UI
    document.getElementById('chat-header').innerHTML = '<span>Select a thread to start chatting</span>';
    document.getElementById('messages-container').innerHTML =
        '<p style="text-align:center;color:var(--text-muted);padding-top:40px;">👋 Welcome to the AI Club Forum!<br>Ask questions, share knowledge, and help each other.</p>';
    document.getElementById('message-input-area').style.display = 'none';
    renderThreads();
}

// ---------- Messages ----------
async function loadMessages(threadId) {
    const { data } = await supabase.from('forum_messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
    const container = document.getElementById('messages-container');
    if (!data) return;
    container.innerHTML = data.length ? data.map(m => {
        const isSent = m.user_id === currentUser?.id;
        return `<div class="message-row ${isSent ? 'sent' : 'received'}" id="msg-${m.id}" data-timestamp="${m.created_at}">
            <div class="message-bubble">
                <div class="message-sender" style="font-weight:600;font-size:0.8rem;">${isSent ? 'You' : (m.user_name || 'Unknown')}</div>
                <div>${m.content.replace(/\n/g,'<br>')}</div>
                <div class="message-time">${new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
                ${(isSent || userProfile?.role === 'admin') ? `<div style="text-align:right;margin-top:4px;"><button class="btn btn-ghost btn-sm" onclick="deleteMessage('${m.id}','${threadId}')">🗑️</button></div>` : ''}
            </div>
        </div>`;
    }).join('') : '<p style="text-align:center;color:var(--text-muted);">No messages yet.</p>';
    container.scrollTop = container.scrollHeight;
}

function appendMessageToUI(message, isSent) {
    // If no thread is open, don't show anything
    if (!activeThreadId) return;
    // Deduplicate
    if (document.getElementById(`msg-${message.id}`)) return;

    const container = document.getElementById('messages-container');
    if (!container) return;
    if (container.querySelector('p') && container.querySelector('p').textContent.includes('No messages')) {
        container.innerHTML = '';
    }
    const div = document.createElement('div');
    div.className = `message-row ${isSent ? 'sent' : 'received'}`;
    div.id = `msg-${message.id}`;
    div.dataset.timestamp = message.created_at;
    div.innerHTML = `
        <div class="message-bubble">
            <div class="message-sender" style="font-weight:600;font-size:0.8rem;">${isSent ? 'You' : (message.user_name || 'Unknown')}</div>
            <div>${message.content.replace(/\n/g,'<br>')}</div>
            <div class="message-time">${new Date(message.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
            ${isSent ? `<div style="text-align:right;margin-top:4px;"><button class="btn btn-ghost btn-sm" onclick="deleteMessage('${message.id}','${activeThreadId}')">🗑️</button></div>` : ''}
        </div>`;
    container.appendChild(div);
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    if (!content || !activeThreadId) return;
    const fullName = userProfile?.full_name || currentUser.email.split('@')[0];
    const tempId = 'temp-' + Date.now();
    const optimistic = { id: tempId, user_id: currentUser.id, user_name: fullName, content, created_at: new Date().toISOString() };
    appendMessageToUI(optimistic, true);
    input.value = '';
    document.getElementById('messages-container').scrollTop = document.getElementById('messages-container').scrollHeight;
    const { data, error } = await supabase.from('forum_messages').insert({ thread_id: activeThreadId, user_id: currentUser.id, user_name: fullName, content }).select();
    if (error) { document.getElementById(`msg-${tempId}`).remove(); showToast('Error sending', 'error'); }
    else if (data) {
        const realMsg = data[0];
        const tempEl = document.getElementById(`msg-${tempId}`);
        if (tempEl) {
            tempEl.id = `msg-${realMsg.id}`;
            tempEl.dataset.timestamp = realMsg.created_at;
            const delBtn = tempEl.querySelector('button');
            if (delBtn) delBtn.onclick = () => deleteMessage(realMsg.id, activeThreadId);
        }
    }
}

// ---------- Realtime (attempt) ----------
function subscribeToThread(threadId) {
    unsubscribeFromThread();
    if (!supabase?.channel) return;
    realtimeSubscription = supabase
        .channel(`forum-msgs-${threadId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forum_messages', filter: `thread_id=eq.${threadId}` }, payload => {
            const msg = payload.new;
            if (msg.user_id === currentUser?.id || activeThreadId !== threadId) return;
            appendMessageToUI(msg, false);
            document.getElementById('messages-container').scrollTop = document.getElementById('messages-container').scrollHeight;
        })
        .subscribe((status, err) => console.log('Realtime status:', status, err?.message || ''));
}

function unsubscribeFromThread() {
    if (realtimeSubscription) { supabase.removeChannel(realtimeSubscription); realtimeSubscription = null; }
}

// ---------- Polling fallback (always active) ----------
function startPolling(threadId) {
    stopPolling();
    pollingInterval = setInterval(async () => {
        if (activeThreadId !== threadId) { stopPolling(); return; }
        const lastEl = document.querySelector('#messages-container .message-row:last-child');
        const since = lastEl ? lastEl.dataset.timestamp || '1970-01-01' : '1970-01-01';
        const { data } = await supabase.from('forum_messages').select('*').eq('thread_id', threadId).gt('created_at', since).order('created_at');
        if (data && data.length) {
    let maxTimestamp = since;
    data.forEach(m => {
        if (m.user_id !== currentUser?.id) {
            appendMessageToUI(m, false);
        }
        if (m.created_at > maxTimestamp) maxTimestamp = m.created_at;
    });
    // Update the last element's timestamp for the next poll (optional)
    const lastEl = document.querySelector('#messages-container .message-row:last-child');
    if (lastEl) lastEl.dataset.timestamp = maxTimestamp;
    document.getElementById('messages-container').scrollTop = document.getElementById('messages-container').scrollHeight;
}
    }, 2000);
}

function stopPolling() {
    if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
}

// ---------- Delete & Admin ----------
async function deleteMessage(msgId, threadId) {
    if (!confirm('Delete message?')) return;
    const { error } = await supabase.from('forum_messages').delete().eq('id', msgId);
    if (error) showToast('Error deleting', 'error');
    else loadMessages(threadId);
}

async function deleteThread(threadId) {
    if (!confirm('Delete thread and all messages?')) return;
    const { error } = await supabase.from('forum_threads').delete().eq('id', threadId);
    if (error) showToast('Error deleting', 'error');
    else { showToast('Deleted', 'success'); if (activeThreadId === threadId) closeThread(); loadThreads(); }
}

function showNewThreadModal() {
    const name = userProfile?.full_name || currentUser.email.split('@')[0];
    showModal('New Discussion', `
        <div class="input-group"><label>Title</label><input type="text" id="thread-title"></div>
        <div class="input-group"><label>Category</label>
            <select id="thread-category"><option>General</option><option>AI</option><option>Machine Learning</option><option>Deep Learning</option><option>Python</option><option>DSA</option><option>Research</option><option>Help</option></select>
        </div>
    `, async () => {
        const title = document.getElementById('thread-title').value.trim();
        const category = document.getElementById('thread-category').value;
        if (!title) return showToast('Title required', 'error');
        const { error } = await supabase.from('forum_threads').insert({ title, category, author_id: currentUser.id, author_name: name });
        if (error) showToast('Error', 'error');
        else { showToast('Thread created!', 'success'); loadThreads(); }
    });
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
}
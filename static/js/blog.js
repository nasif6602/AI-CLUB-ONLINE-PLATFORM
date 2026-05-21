// Blog system – load, render, CRUD

async function loadBlogs() {
    const { data, error } = await supabase.from('blogs').select('*').order('created_at', { ascending: false });
    if (data) {
        allBlogs = data;
        renderBlogs();
    }
}

function renderBlogs() {
    const search = document.getElementById('blog-search')?.value.toLowerCase() || '';
    let filtered = currentBlogFilter === 'all' ? allBlogs : allBlogs.filter(b => b.tags?.includes(currentBlogFilter));
    if (search) filtered = filtered.filter(b => b.title?.toLowerCase().includes(search) || b.excerpt?.toLowerCase().includes(search) || b.tags?.some(t => t.toLowerCase().includes(search)));
    if (currentDateFilter) filtered = filtered.filter(b => new Date(b.created_at).toDateString() === currentDateFilter.toDateString());

    const published = filtered.filter(b => b.is_published);
    const featured = (currentBlogFilter === 'all' && !search && !currentDateFilter) ? published[0] : null;
    const featuredEl = document.getElementById('featured-blog');
    if (featured) {
        featuredEl.style.display = '';
        featuredEl.innerHTML = `<div class="featured-blog" onclick="viewBlog('${featured.id}')" style="display:flex; align-items:stretch; gap:16px; padding:18px; font-family:system-ui,-apple-system,sans-serif; cursor:pointer;">
    ${featured.cover_image ? `<img src="${featured.cover_image}" alt="${featured.title}" style="width:140px; height:100%; object-fit:cover; border-radius:8px; flex-shrink:0; background:var(--img-placeholder, #f1f5f9);">` : ''}
    <div style="flex:1; display:flex; flex-direction:column; gap:8px; min-width:0;">
        <span class="badge badge-green" style="align-self:flex-start; font-size:0.7rem; padding:3px 8px; border-radius:999px; background:var(--success-bg, #dcfce7); color:var(--success-text, #166534); font-weight:600; letter-spacing:0.3px; text-transform:uppercase;">📌 Featured</span>
        <h3 style="margin:0; font-size:1.15rem; font-weight:600; color:var(--text-primary, #0f172a); line-height:1.4;">${featured.title}</h3>
        <p style="margin:0; font-size:0.875rem; color:var(--text-secondary, #475569); line-height:1.6; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${featured.excerpt || featured.content?.substring(0,50)}...</p>
        <div class="blog-meta" style="display:flex; flex-wrap:wrap; gap:12px; margin-top:auto; padding-top:8px; border-top:1px solid var(--border-color, #e2e8f0); font-size:0.75rem; color:var(--text-muted, #64748b);">
            <span style="display:inline-flex; align-items:center; gap:18px;">👤 ${featured.author_name}</span>
            <span style="display:inline-flex; align-items:center; gap:18px;">👁️ ${featured.views||0}</span>
            <span style="display:inline-flex; align-items:center; gap:18px;">❤️ ${featured.likes||0}</span>
            <span style="display:inline-flex; align-items:center; gap:18px;">📆 ${new Date(featured.created_at).toLocaleDateString()}</span>
        </div>
    </div>
</div>`;
    } else {
        featuredEl.style.display = 'none';
    }

    const blogsHtml = filtered.map(blog => {
        const d = new Date(blog.created_at);
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
        let dateLabel = d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
        if (d.toDateString() === today.toDateString()) dateLabel = '🕐 Today';
        else if (d.toDateString() === yesterday.toDateString()) dateLabel = ' Yesterday';
        return `<div class="card blog-card" onclick="viewBlog('${blog.id}')">${blog.cover_image ? `<img src="${blog.cover_image}" class="blog-cover">` : `<div class="blog-cover" style="display:flex;align-items:center;justify-content:center;font-size:3rem;">📝</div>`}<span class="badge" style="background:var(--bg-tertiary);color:var(--text-secondary);">${dateLabel}</span><h4 style="margin:0; font-size:1.15rem; font-weight:600; color:var(--text-primary, #0f172a); line-height:1.4;">${blog.title}</h4><p class="blog-excerpt" style="margin:0; font-size:0.875rem; color:var(--text-secondary, #475569); line-height:1.6; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${blog.excerpt || blog.content?.substring(0,100)}...</p><div class="blog-tags">${(blog.tags||[]).slice(0,3).map(t=>`<span class="blog-tag">${t}</span>`).join('')}</div>
        <div class="blog-meta" style="display:flex; flex-wrap:wrap; gap:18px; margin-top:auto; padding-top:8px; border-top:1px solid var(--border-color, #e2e8f0); font-size:0.75rem; color:var(--text-muted, #64748b);">
            <span style="display:inline-flex; align-items:center; gap:18px;"><span>👤 ${blog.author_name}</span><span style="display:inline-flex; align-items:center; gap:18px;">❤️ ${blog.likes||0}</span>
            <span style="display:inline-flex; align-items:center; gap:18px;">👁️ ${blog.views||0}</span></div>${!blog.is_published?'<span class="badge" style="background:rgba(248,129,73,0.2);color:var(--orange);">Draft</span>':''}</div>`;
    }).join('');
    document.getElementById('blogs-grid').innerHTML = blogsHtml || '<p style="color:var(--text-muted);grid-column:1/-1;">No blogs found</p>';
}

function renderTodayBlogs() {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const todayBlogs = allBlogs.filter(b => {
        const d = new Date(b.created_at);
        return d >= todayStart && d <= todayEnd && b.is_published;
    });
    const emojis = ['🤖','🧠','💡','🚀','📊','🔬','💻','📈','🎯','⚡'];
    const container = document.getElementById('today-blogs-feed');
    if (!container) return;

    // Scrollable stories + Write button (when blogs exist)
    const scrollHtml = `
        <div style="display:flex; gap:4px; overflow-x:auto; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch; scrollbar-width:none; -ms-overflow-style:none;">
            ${todayBlogs.slice(0, 3).map((b, i) => `
                <div class="today-blog-story" onclick="viewBlog('${b.id}')" style="display:flex; flex-direction:column; align-items:center; gap:4px; min-width:78px; max-width:83px; border-radius:12px; cursor:pointer; background:var(--card-bg, transparent); transition:transform 0.2s; scroll-snap-align:start; -webkit-tap-highlight-color:transparent;">
                    <div class="story-cover" style="width:72px; height:72px; border-radius:50%; overflow:hidden; background:var(--bg-tertiary, #f1f5f9); border:2px solid var(--accent-color, #3b82f6); box-shadow:0 3px 8px rgba(0,0,0,0.1); flex-shrink:0;">
                        <div class="story-cover-inner" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:var(--bg-secondary, #f8fafc);">
                            ${b.cover_image ? `<img src="${b.cover_image}" style="width:100%;height:100%;object-fit:cover;">` : `<span class="story-emoji" style="font-size:1.8rem;">${emojis[i % emojis.length]}</span>`}
                        </div>
                    </div>
                    <div class="story-title" style="font-size:0.75rem; font-weight:600; color:var(--text-primary, #0f172a); text-align:center; line-height:1.2; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${b.title}</div>
                    <div class="story-author" style="font-size:0.65rem; color:var(--text-muted, #64748b); text-align:center; line-height:1.2; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">by ${b.author_name?.split(' ')[0]}</div>
                </div>
            `).join('')}
            <!-- Write button always at end of scroll -->
            <div onclick="navigateTo('blogs')" style="display:flex; flex-direction:column; align-items:center; gap:4px; min-width:85px; max-width:85px; flex-shrink:0; scroll-snap-align:start; cursor:pointer;">
                <div style="width:72px;height:72px;border-radius:50%;background:var(--bg-tertiary);border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:1.6rem;color:var(--text-muted);">➕</span>
                </div>
                <div style="font-size:0.75rem;font-weight:600;color:var(--text-primary);text-align:center;">Write</div>
            </div>
        </div>
    `;

    // Standalone Write button (when no blogs today)
    const emptyHtml = `
        <div onclick="navigateTo('blogs')" style="display:flex; flex-direction:column; align-items:center; gap:4px; min-width:85px; max-width:85px; flex-shrink:0; cursor:pointer;">
            <div style="width:72px;height:72px;border-radius:50%;background:var(--bg-tertiary);border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;">
                <span style="font-size:1.6rem;color:var(--text-muted);">✍️</span>
            </div>
            <div style="font-size:0.75rem;font-weight:600;color:var(--text-primary);text-align:center;">Write Blog</div>
        </div>
    `;

    // 🔑 FIXED: Clean ternary with proper syntax and both states
    container.innerHTML = todayBlogs.length > 0 ? scrollHtml : emptyHtml;
}

function renderRecentBlogs() {
    const recent = allBlogs.filter(b => b.is_published).slice(0,4);
    document.getElementById('dash-blogs-list').innerHTML = recent.length ? recent.map(blog => `
        <div class="dash-blog-item" onclick="viewBlog('${blog.id}')" style="display:flex; align-items:center; gap:14px; padding:12px 16px;cursor:pointer; transition:background 0.2s, border-color 0.2s;">
    <div class="dash-blog-thumb" style="width:64px; height:64px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:1.4rem; border:1px solid var(--border-color, #e2e8f0);">${blog.cover_image ? `<img src="${blog.cover_image}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-sm, 8px);">` : '📝'}</div>
    <div class="dash-blog-info" style="flex:1; min-width:0; display:flex; flex-direction:column; gap:4px;"><h4 style="margin:0; font-size:0.95rem; font-weight:600; color:var(--text-primary, #0f172a); line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${blog.title}</h4><p style="margin:0; font-size:0.8rem; color:var(--text-secondary, #64748b); line-height:1.4; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">by ${blog.author_name} · ❤️ ${blog.likes||0} · ${new Date(blog.created_at).toLocaleDateString()}</p></div>
    <span style="color:var(--text-muted, #94a3b8); font-size:1.1rem; flex-shrink:0; opacity:0.7;">→</span>
</div>`).join('') : '<p style="color:var(--text-muted);">No blogs yet. <a href="#" onclick="navigateTo(\'blogs\')" style="color:var(--accent);">Write the first one!</a></p>';
}

function filterBlogs(tag, btn) {
    currentBlogFilter = tag;
    document.querySelectorAll('#blog-tags-filter button').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderBlogs();
}

function filterBlogsByDate() {
    const val = document.getElementById('blog-date-filter').value;
    currentDateFilter = val ? new Date(val) : null;
    document.getElementById('clear-date-btn').style.display = currentDateFilter ? '' : 'none';
    renderBlogs();
}

function clearDateFilter() {
    document.getElementById('blog-date-filter').value = '';
    currentDateFilter = null;
    document.getElementById('clear-date-btn').style.display = 'none';
    renderBlogs();
}
function viewBlog(blogId) {
    const blog = allBlogs.find(b => b.id === blogId);
    if (!blog) return;

    // Increment view count (if not already viewed)
    const viewedKey = `viewed_blogs_${currentUser?.id || 'anonymous'}`;
    let viewedBlogs = [];
    try { viewedBlogs = JSON.parse(localStorage.getItem(viewedKey)) || []; } catch(e) {}
    if (!viewedBlogs.includes(blogId)) {
        supabase.from('blogs').update({ views: (blog.views || 0) + 1 }).eq('id', blogId).then(() => {
            blog.views = (blog.views || 0) + 1;
        });
        viewedBlogs.push(blogId);
        localStorage.setItem(viewedKey, JSON.stringify(viewedBlogs));
    }

    const isLiked = localStorage.getItem(`liked_blog_${blogId}`) === 'true';

    // Build modal content (will be filled after data load)
    document.getElementById('modal-container').innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
            <div class="modal" style="max-width:850px;max-height:90vh;padding:0;overflow-y:auto;">
                <div style="position:sticky;top:0;background:var(--bg-card);padding:16px 24px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;z-index:1;">
                    <h3 style="margin:0;">${blog.title}</h3>
                    <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button>
                </div>
                <div style="padding:24px;">
                    ${blog.cover_image ? `<img src="${blog.cover_image}" style="width:100%;max-height:400px;object-fit:cover;border-radius:var(--radius-sm);margin-bottom:20px;">` : ''}
                    <div class="blog-meta">
                        <span style="display:inline-flex; align-items:center; gap:25px;">👤 ${blog.author_name}</span>
                        <span style="display:inline-flex; align-items:center; gap:25px;">📅 ${new Date(blog.created_at).toLocaleDateString()}</span>
                        <span style="display:inline-flex; align-items:center; gap:25px;">👁️ ${blog.views || 0}</span>
                    </div>
                    <div class="blog-tags" style="margin:12px 0;">${(blog.tags||[]).map(t=>`<span class="blog-tag">${t}</span>`).join('')}</div>
                    <div class="blog-content-full">${blog.content?.replace(/\n/g,'<br>')}</div>

                    <!-- Reactions Row -->
                    <div style="display:flex;gap:16px;align-items:center;margin-top:24px;padding-top:16px;border-top:1px solid var(--border);flex-wrap:wrap;" id="blog-reactions-${blog.id}">
                        <!-- Dynamically filled -->
                    </div>

                    <!-- Like button (from previous) -->
                    <div style="margin-top:8px;">
                        <button class="like-btn ${isLiked?'liked':''}" onclick="toggleLike('${blog.id}', event)">
                            ${isLiked?'❤️':'🤍'} <span id="like-count-${blog.id}">${blog.likes||0}</span> Likes
                        </button>
                    </div>

                    ${(currentUser?.id === blog.author_id || userProfile?.role === 'admin') ? `
                        <div style="display:flex;gap:8px;margin-top:8px;">
                            <button class="btn btn-sm btn-outline" onclick="editBlog('${blog.id}')">✏️ Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteBlog('${blog.id}')">🗑️ Delete</button>
                        </div>` : ''}

                    <!-- Comments Section -->
                    <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border);">
                        <h4 style="margin-bottom:12px;">💬 Comments (<span id="comment-count-${blog.id}">0</span>)</h4>
                        <div id="comments-list-${blog.id}" style="margin-bottom:16px;"></div>
                        <div class="input-group">
                            <textarea id="comment-input-${blog.id}" placeholder="Write a comment..." rows="2" style="width:100%;"></textarea>
                        </div>
                        <button class="btn btn-sm btn-primary" onclick="submitComment('${blog.id}')">💬 Post Comment</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load reactions and comments
    loadReactions(blogId);
    loadComments(blogId);
}

// ---------- Reactions ----------
async function loadReactions(blogId) {
    const { data, error } = await supabase
        .from('blog_reactions')
        .select('reaction_type, user_id')
        .eq('blog_id', blogId);

    if (error) return;

    // Count reactions by type
    const counts = {};
    const userReactions = new Set();
    data.forEach(r => {
        counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
        if (r.user_id === currentUser?.id) userReactions.add(r.reaction_type);
    });

    const reactionTypes = ['🔥','👏','💡','❤️','😮'];
    const container = document.getElementById(`blog-reactions-${blogId}`);
    if (!container) return;

    container.innerHTML = reactionTypes.map(emoji => {
        const count = counts[emoji] || 0;
        const active = userReactions.has(emoji);
        return `
            <button class="reaction-btn ${active ? 'active' : ''}"
                    onclick="toggleReaction('${blogId}', '${emoji}')"
                    style="display:flex;align-items:center;gap:4px;padding:6px 4px;border-radius:20px;border:1px solid var(--border);background:${active?'rgba(88,166,255,0.2)':'transparent'};color:var(--text-primary);cursor:pointer;font-family:inherit;font-size:0.9rem;transition:all 0.2s;">
                ${emoji} <span>${count}</span>
            </button>`;
    }).join('');
}

async function toggleReaction(blogId, emoji) {
    if (!currentUser) return showToast('Login required', 'error');

    // Check if user already reacted with this emoji
    const { data } = await supabase
        .from('blog_reactions')
        .select('id')
        .eq('blog_id', blogId)
        .eq('user_id', currentUser.id)
        .eq('reaction_type', emoji)
        .single();

    if (data) {
        // Remove reaction
        await supabase.from('blog_reactions').delete().eq('id', data.id);
    } else {
        // Add reaction
        await supabase.from('blog_reactions').insert({
            blog_id: blogId,
            user_id: currentUser.id,
            reaction_type: emoji
        });
    }
    // Refresh reactions display
    loadReactions(blogId);
}

// ---------- Comments ----------
async function loadComments(blogId) {
    // 1. Fetch all comments for this blog
    const { data: comments, error } = await supabase
        .from('blog_comments')
        .select('id, content, created_at, user_id')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: true });

    if (error || !comments) {
        console.error('Error loading comments:', error);
        return;
    }

    // 2. Extract unique user IDs
    const userIds = [...new Set(comments.map(c => c.user_id))];

    // 3. Fetch profiles for those users
    let profilesMap = {};
    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);
        if (profiles) {
            profiles.forEach(p => { profilesMap[p.id] = p.full_name; });
        }
    }

    // 4. Combine
    const enrichedComments = comments.map(c => ({
        ...c,
        author_name: profilesMap[c.user_id] || 'User'
    }));

    // 5. Render
    const container = document.getElementById(`comments-list-${blogId}`);
    const countSpan = document.getElementById(`comment-count-${blogId}`);
    if (countSpan) countSpan.textContent = enrichedComments.length;

    if (!container) return;
    if (enrichedComments.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);">No comments yet. Be the first!</p>';
        return;
    }

    container.innerHTML = enrichedComments.map(comment => `
        <div style="padding:8px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:start;">
            <div>
                <strong style="font-size:0.9rem;">${comment.author_name}</strong>
                <small style="color:var(--text-muted);margin-left:8px;">${new Date(comment.created_at).toLocaleDateString()}</small>
                <p style="margin-top:4px;">${comment.content}</p>
            </div>
            <div style="display:flex;gap:4px;">
                ${currentUser?.id === comment.user_id ? `<button class="btn btn-ghost btn-sm" onclick="editComment('${comment.id}', '${blogId}')">✏️</button>` : ''}
                ${(currentUser?.id === comment.user_id || userProfile?.role === 'admin') ? `<button class="btn btn-ghost btn-sm" onclick="deleteComment('${comment.id}', '${blogId}')">🗑️</button>` : ''}
            </div>
        </div>
    `).join('');
}

async function submitComment(blogId) {
    const input = document.getElementById(`comment-input-${blogId}`);
    const content = input?.value.trim();
    if (!content) return showToast('Comment cannot be empty', 'error');
    if (!currentUser) return showToast('Login required', 'error');

    const { error } = await supabase.from('blog_comments').insert({
        blog_id: blogId,
        user_id: currentUser.id,
        content
    });
    if (error) return showToast('Error posting comment', 'error');

    input.value = '';
    loadComments(blogId);
}

async function editComment(commentId, blogId) {
    const newContent = prompt('Edit your comment:');
    if (!newContent || !newContent.trim()) return;
    const { error } = await supabase.from('blog_comments').update({ content: newContent.trim(), updated_at: new Date().toISOString() }).eq('id', commentId);
    if (error) return showToast('Error updating comment', 'error');
    loadComments(blogId);
}

async function deleteComment(commentId, blogId) {
    if (!confirm('Delete this comment?')) return;
    const { error } = await supabase.from('blog_comments').delete().eq('id', commentId);
    if (error) return showToast('Error deleting comment', 'error');
    loadComments(blogId);
}

async function toggleLike(blogId, event) {
    event.stopPropagation();
    const blog = allBlogs.find(b => b.id === blogId);
    if (!blog) return;
    const isLiked = localStorage.getItem(`liked_blog_${blogId}`) === 'true';
    const newLikes = isLiked ? (blog.likes||1)-1 : (blog.likes||0)+1;
    const { error } = await supabase.from('blogs').update({ likes: newLikes }).eq('id', blogId);
    if (!error) {
        blog.likes = newLikes;
        if (isLiked) localStorage.removeItem(`liked_blog_${blogId}`); else localStorage.setItem(`liked_blog_${blogId}`, 'true');
        const el = document.getElementById(`like-count-${blogId}`); if (el) el.textContent = newLikes;
        const btn = event.target.closest('.like-btn');
        if (btn) { btn.classList.toggle('liked', !isLiked); btn.innerHTML = `${!isLiked?'❤️':'🤍'} <span id="like-count-${blogId}">${newLikes}</span> Likes`; }
    }
}

function showCreateBlogModal(editData = null) {
    const isEdit = !!editData;
    showModal(isEdit?'Edit Blog':'Write New Blog', `
        <div style="display:flex; flex-direction:column; gap:18px;">
    <div class="input-group" style="display:flex; flex-direction:column; gap:6px;">
        <label style="font-size:0.875rem; font-weight:500; color:var(--text-secondary, #475569);">Title</label>
        <input type="text" id="blog-title" value="${editData?.title||''}" style="width:100%; padding:10px 12px; font-size:0.95rem;color: black; background:var(--input-bg, #ffffff); border:1px solid var(--input-border, #e2e8f0); border-radius:8px; outline:none; transition:all 0.2s; box-sizing:border-box;" onfocus="this.style.borderColor='var(--primary, #3b82f6)'; this.style.boxShadow='0 0 0 3px var(--primary-light, rgba(59,130,246,0.15))'" onblur="this.style.borderColor='var(--input-border, #e2e8f0)'; this.style.boxShadow='none'">
    </div>
    <div class="input-group" style="display:flex; flex-direction:column; gap:6px;">
        <label style="font-size:0.875rem; font-weight:500; color:var(--text-secondary, #475569);">Cover Image URL(Optional)</label>
        <input type="url" id="blog-cover" value="${editData?.cover_image||''}" style="width:100%; padding:10px 12px; font-size:0.95rem;color: black; background:var(--input-bg, #ffffff); border:1px solid var(--input-border, #e2e8f0); border-radius:8px; outline:none; transition:all 0.2s; box-sizing:border-box;" onfocus="this.style.borderColor='var(--primary, #3b82f6)'; this.style.boxShadow='0 0 0 3px var(--primary-light, rgba(59,130,246,0.15))'" onblur="this.style.borderColor='var(--input-border, #e2e8f0)'; this.style.boxShadow='none'">
    </div>
    <div class="input-group" style="display:flex; flex-direction:column; gap:6px;">
        <label style="font-size:0.875rem; font-weight:500; color:var(--text-secondary, #475569);">Excerpt</label>
        <textarea id="blog-excerpt" style="width:100%; padding:10px 12px; font-size:0.95rem;color: black; background:var(--input-bg, #ffffff); border:1px solid var(--input-border, #e2e8f0); border-radius:8px; outline:none; transition:all 0.2s; box-sizing:border-box; resize:vertical; min-height:80px; font-family:inherit;" onfocus="this.style.borderColor='var(--primary, #3b82f6)'; this.style.boxShadow='0 0 0 3px var(--primary-light, rgba(59,130,246,0.15))'" onblur="this.style.borderColor='var(--input-border, #e2e8f0)'; this.style.boxShadow='none'">${editData?.excerpt||''}</textarea>
    </div>
    <div class="input-group" style="display:flex; flex-direction:column; gap:6px;">
        <label style="font-size:0.875rem; font-weight:500; color:var(--text-secondary, #475569);">Tags (comma separated)</label>
        <input type="text" id="blog-tags" value="${(editData?.tags||[]).join(', ')}" style="width:100%; padding:10px 12px; font-size:0.95rem; color: black;background:var(--input-bg, #ffffff); border:1px solid var(--input-border, #e2e8f0); border-radius:8px; outline:none; transition:all 0.2s; box-sizing:border-box;" onfocus="this.style.borderColor='var(--primary, #3b82f6)'; this.style.boxShadow='0 0 0 3px var(--primary-light, rgba(59,130,246,0.15))'" onblur="this.style.borderColor='var(--input-border, #e2e8f0)'; this.style.boxShadow='none'">
    </div>
    <div class="input-group" style="display:flex; flex-direction:column; gap:6px;">
        <label style="font-size:0.875rem; font-weight:500; color:var(--text-secondary, #475569);">Content</label>
        <textarea id="blog-content" style="min-height:200px; width:100%; padding:10px 12px; font-size:0.95rem;color: black; background:var(--input-bg, #ffffff); border:1px solid var(--input-border, #e2e8f0); border-radius:8px; outline:none; transition:all 0.2s; box-sizing:border-box; resize:vertical; font-family:inherit; line-height:1.6;" onfocus="this.style.borderColor='var(--primary, #3b82f6)'; this.style.boxShadow='0 0 0 3px var(--primary-light, rgba(59,130,246,0.15))'" onblur="this.style.borderColor='var(--input-border, #e2e8f0)'; this.style.boxShadow='none'">${editData?.content||''}</textarea>
    </div>
    <div class="input-group" style="display:flex; align-items:center; gap:8px; margin-top:4px;">
        <label style="font-size:0.9rem; color:var(--text-primary, #0f172a); font-weight:500; cursor:pointer; display:flex; align-items:center; gap:8px; margin:0;"><input type="checkbox" id="blog-published" ${editData?.is_published!==false?'checked':''} style="width:16px; height:16px; accent-color:var(--primary, #3b82f6); cursor:pointer; margin:0;"> Publish immediately</label>
    </div>
</div>`
    , async () => {
        const data = {
            title: document.getElementById('blog-title').value.trim(),
            cover_image: document.getElementById('blog-cover').value.trim(),
            excerpt: document.getElementById('blog-excerpt').value.trim(),
            tags: document.getElementById('blog-tags').value.split(',').map(s=>s.trim()).filter(Boolean),
            content: document.getElementById('blog-content').value.trim(),
            is_published: document.getElementById('blog-published').checked,
            author_id: currentUser.id,
            author_name: userProfile?.full_name || currentUser.email,
            updated_at: new Date().toISOString()
        };
        if (!data.title || !data.content) return showToast('Title and content required', 'error');
        let error;
        if (isEdit) ({ error } = await supabase.from('blogs').update(data).eq('id', editData.id));
        else { data.created_at = new Date().toISOString(); ({ error } = await supabase.from('blogs').insert(data)); }
        if (error) showToast('Error: '+error.message, 'error');
        else { showToast(isEdit?'Updated!':'Published!', 'success'); await loadBlogs(); renderBlogs(); }
        // After successful save:

if (typeof renderTodayBlogs === 'function') renderTodayBlogs();
if (typeof renderRecentBlogs === 'function') renderRecentBlogs();
    });
}

function editBlog(blogId) {
    const blog = allBlogs.find(b => b.id === blogId);
    if (!blog) return;
    closeModal();
    setTimeout(() => showCreateBlogModal(blog), 300);
}

async function deleteBlog(blogId) {
    if (!confirm('Delete this blog?')) return;
    const { error } = await supabase.from('blogs').delete().eq('id', blogId);
    if (error) {
        showToast('Error deleting', 'error');
    } else {
        showToast('Deleted', 'success');
        closeModal();
        await loadBlogs();              // reload allBlogs
        renderBlogs();                  // refresh the blog page grid
        // Also refresh dashboard sections (if they exist)
        if (typeof renderTodayBlogs === 'function') renderTodayBlogs();
        if (typeof renderRecentBlogs === 'function') renderRecentBlogs();
    }
}

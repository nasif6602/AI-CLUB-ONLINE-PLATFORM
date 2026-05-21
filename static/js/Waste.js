function renderTodayBlogs() {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const todayBlogs = allBlogs.filter(b => {
        const d = new Date(b.created_at);
        return d >= todayStart && d <= todayEnd && b.is_published;
    });
    const emojis = ['🤖','🧠','💡','🚀','📊','🔬','💻','📈','🎯','⚡'];

    const html = todayBlogs.length ? `
        <div style="display:flex; gap:6px; overflow-x:auto; scroll-snap-type:x mandatory; padding:12px 4px; -webkit-overflow-scrolling:touch; scrollbar-width:none; -ms-overflow-style:none;">
            ${todayBlogs.map((b, i) => `
                <div class="today-blog-story" onclick="viewBlog('${b.id}')" style="display:flex; flex-direction:column; align-items:center; gap:4px; min-width:88px; max-width:95px; padding:10px 4px; border-radius:12px; cursor:pointer; background:var(--card-bg, transparent); transition:transform 0.2s; scroll-snap-align:start; -webkit-tap-highlight-color:transparent;">
                    <div class="story-cover" style=" height:72px; border-radius:50%; overflow:hidden; background:var(--bg-tertiary, #f1f5f9); border:2px solid var(--accent-color, #3b82f6); box-shadow:0 3px 8px rgba(0,0,0,0.1); flex-shrink:0;">
                        <div class="story-cover-inner" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:var(--bg-secondary, #f8fafc);">
                            ${b.cover_image ? `<img src="${b.cover_image}" style="width:100%;height:100%;object-fit:cover;">` : `<span class="story-emoji" style="font-size:1.8rem;">${emojis[i % emojis.length]}</span>`}
                        </div>
                    </div>
                    <div class="story-title" style="font-size:0.75rem; font-weight:600; color:var(--text-primary, #0f172a); text-align:center; line-height:1.2; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${b.title}</div>
                    <div class="story-author" style="font-size:0.65rem; color:var(--text-muted, #64748b); text-align:center; line-height:1.2; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">by ${b.author_name?.split(' ')[0]}</div>
                </div>
            `).join('')}
            ${todayBlogs.length > 3 ? `
                <div class="today-blog-story" onclick="navigateTo('blogs')" style="display:flex; flex-direction:column; align-items:center; gap:6px; min-width:88px; max-width:95px; padding:10px 4px; border-radius:12px; cursor:pointer; background:var(--card-bg, transparent); transition:transform 0.2s; scroll-snap-align:start;">
                    <div class="story-cover" style="width:72px; height:72px; border-radius:50%; overflow:hidden; background:var(--bg-tertiary, #f1f5f9); border:2px dashed var(--border-color, #cbd5e1); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <div class="story-cover-inner" style="display:flex; align-items:center; justify-content:center; font-size:1.6rem; color:var(--text-muted, #64748b);">➕</div>
                    </div>
                    <div class="story-title" style="font-size:0.75rem; font-weight:600; color:var(--text-primary, #0f172a); text-align:center;">View All</div>
                </div>
            ` : ''}
        </div>
    ` : '<p style="padding:12px; color:var(--text-muted); text-align:center;">No blogs published today</p>';

    document.getElementById('today-blogs-feed').innerHTML = html;
}

function renderTodayBlogs() {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const todayBlogs = allBlogs.filter(b => {
        const d = new Date(b.created_at);
        return d >= todayStart && d <= todayEnd && b.is_published;
    });
    const emojis = ['🤖','🧠','💡','🚀','📊','🔬','💻','📈','🎯','⚡'];

    if (!todayBlogs.length) {
        document.getElementById('today-blogs-feed').innerHTML = '<p style="padding:12px; color:var(--text-muted); text-align:center;">No blogs published today</p>';
        return;
    }

    const html = `
        <div style="width:100%; max-width:100%; display:flex; gap:12px; overflow-x:auto; scroll-snap-type:x mandatory; padding:12px 4px; -webkit-overflow-scrolling:touch; scrollbar-width:none; -ms-overflow-style:none; box-sizing:border-box;">
            ${todayBlogs.map((b, i) => `
                <div class="today-blog-story" onclick="viewBlog('${b.id}')" style="flex:0 0 88px; display:flex; flex-direction:column; align-items:center; gap:6px; padding:10px 6px; border-radius:12px; cursor:pointer; background:var(--card-bg, transparent); transition:transform 0.2s; scroll-snap-align:start; -webkit-tap-highlight-color:transparent;">
                    <div class="story-cover" style="width:72px; height:72px; border-radius:50%; overflow:hidden; background:var(--bg-tertiary, #f1f5f9); border:2px solid var(--accent-color, #3b82f6); box-shadow:0 3px 8px rgba(0,0,0,0.1); flex-shrink:0;">
                        <div class="story-cover-inner" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:var(--bg-secondary, #f8fafc);">
                            ${b.cover_image ? `<img src="${b.cover_image}" style="width:100%;height:100%;object-fit:cover;">` : `<span class="story-emoji" style="font-size:1.8rem;">${emojis[i % emojis.length]}</span>`}
                        </div>
                    </div>
                    <div class="story-title" style="font-size:0.75rem; font-weight:600; color:var(--text-primary, #0f172a); text-align:center; line-height:1.2; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${b.title}</div>
                    <div class="story-author" style="font-size:0.65rem; color:var(--text-muted, #64748b); text-align:center; line-height:1.2; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">by ${b.author_name?.split(' ')[0]}</div>
                </div>
            `).join('')}
        </div>
    `;

    document.getElementById('today-blogs-feed').innerHTML = html;
}
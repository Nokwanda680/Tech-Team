// Find My Vibe — Student dashboard overview
// NOTE: this page used to show a "Vibe Score", a fake move-in checklist,
// and a fake Messages inbox — none of that has a backing model anywhere
// (no VibeScore, no checklist/move-in concept, no messaging system).
// Rebuilt around real data: saved listings, enquiries, reviews, recently
// listed properties, and real notifications.

const API_BASE = 'http://127.0.0.1:8000/api';
const ACCOUNTS_BASE = 'http://127.0.0.1:8000/api/accounts';

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function initials(name) {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
}

async function requireStudent() {
    const response = await fetch(`${ACCOUNTS_BASE}/me/`, { credentials: 'include' });
    if (!response.ok) { window.location.href = '/front-end/login/Login.html'; return null; }
    const user = await response.json();
    if (user.role !== 'STUDENT') { window.location.href = '/front-end/login/Login.html'; return null; }

    const fullName = `${user.first_name} ${user.last_name}`.trim() || user.username;
    document.getElementById('user-name').textContent = fullName;
    document.getElementById('user-role-label').textContent = `Student${user.institution ? ' · ' + user.institution : ''}`;
    document.getElementById('user-avatar').textContent = initials(fullName);
    document.getElementById('greeting-name').textContent = user.first_name || user.username;
    return user;
}

async function loadFavourites() {
    try {
        const response = await fetch(`${API_BASE}/favourites/`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const favourites = data.results !== undefined ? data.results : data;
        document.getElementById('stat-saved').textContent = favourites.length;
        document.getElementById('nav-saved-badge').textContent = favourites.length;
    } catch (error) {
        console.error('Error loading favourites:', error);
    }
}

async function loadEnquiries() {
    const tbody = document.getElementById('dashboard-enquiries-tbody');
    try {
        const response = await fetch(`${API_BASE}/enquiries/`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const enquiries = data.results !== undefined ? data.results : data;

        document.getElementById('stat-enquiries').textContent = enquiries.length;
        const open = enquiries.filter(e => e.status === 'OPEN').length;
        document.getElementById('stat-enquiries-meta').textContent = `${open} awaiting reply`;
        document.getElementById('nav-enquiries-badge').textContent = open;

        if (!enquiries.length) {
            tbody.innerHTML = '<tr><td colspan="3">No enquiries yet.</td></tr>';
            return;
        }
        tbody.innerHTML = enquiries.slice(0, 4).map(e => `
          <tr>
            <td><span style="font-weight:500">${escapeHTML(e.property_title)}</span></td>
            <td style="color:var(--muted)">${new Date(e.created_at).toLocaleDateString()}</td>
            <td><span class="tag ${e.status === 'OPEN' ? 'tag-pending' : 'tag-available'}">${e.status === 'OPEN' ? 'Pending' : 'Replied'}</span></td>
          </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading enquiries:', error);
        tbody.innerHTML = '<tr><td colspan="3">Could not load enquiries right now.</td></tr>';
    }
}

async function loadReviews() {
    try {
        const response = await fetch(`${API_BASE}/reviews/?mine=true`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const reviews = data.results !== undefined ? data.results : data;
        document.getElementById('stat-reviews').textContent = reviews.length;
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('stat-reviews').textContent = '–';
    }
}

async function loadRecentListings() {
    const container = document.getElementById('recent-listings-list');
    try {
        const response = await fetch(`${API_BASE}/properties/?ordering=-created_at`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const properties = data.results !== undefined ? data.results : data;

        document.getElementById('stat-available').textContent = properties.filter(p => p.is_available).length;

        if (!properties.length) {
            container.innerHTML = '<p>No listings available yet.</p>';
            return;
        }
        const colors = [['var(--blue-dim)', 'var(--blue)'], ['var(--orange-dim)', 'var(--orange)'], ['var(--lime-dim)', 'var(--lime)']];
        container.innerHTML = properties.slice(0, 3).map((p, i) => {
            const [bg, fg] = colors[i % colors.length];
            return `
              <div class="listing-card" style="cursor:pointer" onclick="window.location.href='/front-end/listings/property_detail.html?id=${p.id}'">
                <div class="listing-img" style="background:${bg}; color:${fg};">${escapeHTML(p.title.split(' ').slice(0, 2).map(w => w[0]).join(''))}</div>
                <div class="listing-info">
                  <div class="listing-name">${escapeHTML(p.title)}</div>
                  <div class="listing-addr"><i class="ti ti-map-pin" style="font-size:12px" aria-hidden="true"></i> ${escapeHTML(p.location)}</div>
                  <div class="listing-meta">
                    <span class="tag ${p.is_available ? 'tag-available' : 'tag-pending'}">${p.is_available ? 'Available' : 'Unavailable'}</span>
                  </div>
                </div>
                <div class="listing-price">R ${Number(p.rent).toLocaleString()}<span style="font-size:10px; font-weight:400; color:var(--muted)">/mo</span></div>
              </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading recent listings:', error);
        container.innerHTML = '<p>Could not load listings right now.</p>';
    }
}

async function loadNotifications() {
    const container = document.getElementById('dashboard-notifications-list');
    try {
        const response = await fetch(`${API_BASE}/notifications/`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const notifications = data.results !== undefined ? data.results : data;

        if (!notifications.length) {
            container.innerHTML = '<p style="color:var(--muted); font-size:13px;">No notifications yet.</p>';
            return;
        }
        container.innerHTML = notifications.slice(0, 5).map(n => `
          <div class="msg-row ${n.is_read ? '' : 'msg-unread'}">
            <div class="msg-av" style="background: var(--surface-soft); color: var(--muted);">FMV</div>
            <div class="msg-body">
              <div class="msg-preview">${escapeHTML(n.message)}</div>
            </div>
            <div class="msg-time">${new Date(n.created_at).toLocaleDateString()}</div>
          </div>
        `).join('');
    } catch (error) {
        console.error('Error loading notifications:', error);
        container.innerHTML = '<p style="color:var(--muted); font-size:13px;">Could not load notifications right now.</p>';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = await requireStudent();
    if (!user) return;
    document.getElementById('greeting-subtitle').textContent = 'Here\'s what\'s happening with your accommodation search.';
    loadFavourites();
    loadEnquiries();
    loadReviews();
    loadRecentListings();
    loadNotifications();
});

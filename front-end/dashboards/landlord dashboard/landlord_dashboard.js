// Find My Vibe — Landlord overview page
// NOTE: this page was never actually wired despite every other landlord
// page being real by this point - it still showed a hardcoded "James",
// fake monthly revenue, fake occupancy %, a fake "Vibe Score" applications
// table with Approve/Decline buttons, and a fake maintenance-ticket list.
// Rebuilt around real data: listings, favourites, enquiries, and real
// notifications (same treatment given to the student and admin overviews).

const API_BASE = 'https://find-my-vibe.onrender.com/api';
const ACCOUNTS_BASE = 'https://find-my-vibe.onrender.com/api/accounts';

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function initials(name) {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
}

async function requireLandlord() {
    const response = await fetch(`${ACCOUNTS_BASE}/me/`, { credentials: 'include' });
    if (!response.ok) { window.location.href = '/front-end/login/Login.html'; return null; }
    const user = await response.json();
    if (user.role !== 'LANDLORD') { window.location.href = '/front-end/login/Login.html'; return null; }

    const fullName = `${user.first_name} ${user.last_name}`.trim() || user.username;
    document.querySelector('.user-name').textContent = fullName;
    const avatarEl = document.querySelector('.avatar.avatar-landlord');
    if (avatarEl) avatarEl.textContent = initials(fullName);
    document.getElementById('greeting-name').textContent = user.first_name || user.username;
    return user;
}

async function loadProperties(userId) {
    const container = document.getElementById('dashboard-properties-list');
    try {
        const response = await fetch(`${API_BASE}/properties/?landlord=${userId}`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const properties = data.results !== undefined ? data.results : data;

        document.getElementById('stat-listings').textContent = properties.length;
        const available = properties.filter(p => p.is_available && p.status === 'APPROVED').length;
        document.getElementById('stat-listings-meta').textContent = `${available} available now`;

        if (properties.length) {
            const avgRent = properties.reduce((sum, p) => sum + Number(p.rent), 0) / properties.length;
            document.getElementById('stat-avg-rent').textContent = `R ${Math.round(avgRent).toLocaleString()}`;
            const totalFavourites = properties.reduce((sum, p) => sum + (p.favourites_count || 0), 0);
            document.getElementById('stat-favourites').textContent = totalFavourites;
        } else {
            document.getElementById('stat-avg-rent').textContent = 'R 0';
            document.getElementById('stat-favourites').textContent = '0';
        }

        if (!properties.length) {
            container.innerHTML = '<p>You haven\'t listed any properties yet. <a href="landlord_properties.html">Add your first listing</a>.</p>';
            return;
        }
        const colors = [['var(--orange-dim)', 'var(--orange)'], ['var(--blue-dim)', 'var(--blue)'], ['var(--lime-dim)', 'var(--lime)']];
        container.innerHTML = properties.slice(0, 3).map((p, i) => {
            const [bg, fg] = colors[i % colors.length];
            const tagClass = p.is_available ? 'tag-available' : 'tag-occupied';
            return `
              <div class="listing-card" style="cursor:pointer" onclick="window.location.href='/front-end/listings/property_detail.html?id=${p.id}'">
                <div class="listing-img" style="background:${bg}; color:${fg};">${escapeHTML(initials(p.title))}</div>
                <div class="listing-info">
                  <div class="listing-name">${escapeHTML(p.title)}</div>
                  <div class="listing-addr"><i class="ti ti-map-pin" style="font-size:12px" aria-hidden="true"></i> ${escapeHTML(p.location)}</div>
                  <div class="listing-meta">
                    <span class="tag ${tagClass}">${p.is_available ? 'Available' : 'Unavailable'}</span>
                    <span style="font-size:11px; color:var(--muted)">${p.favourites_count || 0} favourite${p.favourites_count === 1 ? '' : 's'}</span>
                  </div>
                </div>
                <div class="listing-price">R ${Number(p.rent).toLocaleString()}/mo</div>
              </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading properties:', error);
        container.innerHTML = '<p>Could not load your properties right now.</p>';
    }
}

async function loadEnquiries() {
    const tbody = document.getElementById('dashboard-enquiries-tbody');
    try {
        const response = await fetch(`${API_BASE}/enquiries/`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const enquiries = data.results !== undefined ? data.results : data;

        const open = enquiries.filter(e => e.status === 'OPEN').length;
        document.getElementById('stat-open-enquiries').textContent = open;
        const badge = document.getElementById('nav-enquiries-badge');
        if (badge) badge.textContent = open;

        if (!enquiries.length) {
            tbody.innerHTML = '<tr><td colspan="3">No enquiries yet.</td></tr>';
            return;
        }
        tbody.innerHTML = enquiries.slice(0, 4).map(e => `
          <tr>
            <td style="font-weight:500">${escapeHTML(e.student_username)}</td>
            <td style="color:var(--muted)">${escapeHTML(e.property_title)}</td>
            <td><span class="tag ${e.status === 'OPEN' ? 'tag-pending' : 'tag-available'}">${e.status === 'OPEN' ? 'Open' : 'Replied'}</span></td>
          </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading enquiries:', error);
        tbody.innerHTML = '<tr><td colspan="3">Could not load enquiries right now.</td></tr>';
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
          <div class="activity-item">
            <div class="activity-dot" style="background: ${n.is_read ? 'var(--muted)' : 'var(--orange)'}"></div>
            <div class="activity-content">
              <div class="activity-text">${escapeHTML(n.message)}</div>
              <div class="activity-time">${new Date(n.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        `).join('');
    } catch (error) {
        console.error('Error loading notifications:', error);
        container.innerHTML = '<p style="color:var(--muted); font-size:13px;">Could not load notifications right now.</p>';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = await requireLandlord();
    if (!user) return;
    document.getElementById('greeting-subtitle').textContent = 'Here\'s what\'s happening across your listings.';
    loadProperties(user.id);
    loadEnquiries();
    loadNotifications();
});

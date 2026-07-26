// Find My Vibe — Landlord "Listing performance" page (formerly "Revenue")
// NOTE: this page used to show monthly/YTD rand figures and a "1 tenant
// overdue" balance with a fake payment-history table — none of that has a
// backing model (no Payment/lease/tenant concept anywhere in this
// backend). Rebuilt around real data: average rent, availability split,
// favourites, enquiries, and a real per-property rent comparison. The
// "Revenue trend" bar chart is left as illustrative-only (flagged inline
// in the HTML) since it would need real time-series payment tracking.

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
    const nameEl = document.getElementById('user-name');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = fullName;
    if (avatarEl) avatarEl.textContent = initials(fullName);
    return user;
}

async function loadStats(userId) {
    try {
        const response = await fetch(`${API_BASE}/properties/?landlord=${userId}`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const properties = data.results !== undefined ? data.results : data;

        document.getElementById('revenue-subtitle').textContent =
            `Performance across your ${properties.length} listing${properties.length === 1 ? '' : 's'}.`;

        if (!properties.length) {
            document.getElementById('rev-avg-rent').textContent = 'R 0';
            document.getElementById('income-by-property').innerHTML = '<p>You haven\'t listed any properties yet.</p>';
            return;
        }

        const avgRent = properties.reduce((sum, p) => sum + Number(p.rent), 0) / properties.length;
        const available = properties.filter(p => p.is_available && p.status === 'APPROVED').length;
        const totalFavourites = properties.reduce((sum, p) => sum + (p.favourites_count || 0), 0);

        document.getElementById('rev-avg-rent').textContent = `R ${Math.round(avgRent).toLocaleString()}`;
        document.getElementById('rev-avg-rent-meta').textContent = `Across ${properties.length} listing${properties.length === 1 ? '' : 's'}`;
        document.getElementById('rev-available').textContent = `${available}/${properties.length}`;
        document.getElementById('rev-favourites').textContent = totalFavourites.toLocaleString();

        const maxRent = Math.max(...properties.map(p => Number(p.rent)));
        const colors = ['var(--orange)', 'var(--blue)', 'var(--lime)', 'rgba(255,255,255,0.4)', 'var(--danger)'];
        document.getElementById('income-by-property').innerHTML = properties.slice(0, 6).map((p, i) => `
          <div>
            <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:6px">
              <span>${escapeHTML(p.title)}</span><span style="font-weight:600">R ${Number(p.rent).toLocaleString()}/mo</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.round((p.rent / maxRent) * 100)}%; background:${colors[i % colors.length]}"></div></div>
          </div>
        `).join('');

        loadEnquiries(properties.map(p => p.id));
    } catch (error) {
        console.error('Error loading listing stats:', error);
    }
}

async function loadEnquiries() {
    const tbody = document.getElementById('recent-enquiries-tbody');
    document.getElementById('rev-enquiries-meta').textContent = '';
    try {
        const response = await fetch(`${API_BASE}/enquiries/`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const enquiries = data.results !== undefined ? data.results : data;

        document.getElementById('rev-enquiries').textContent = enquiries.length.toLocaleString();
        const open = enquiries.filter(e => e.status === 'OPEN').length;
        document.getElementById('rev-enquiries-meta').textContent = `${open} awaiting your reply`;
        const badge = document.getElementById('nav-enquiries-badge');
        if (badge) badge.textContent = open;

        if (!enquiries.length) {
            tbody.innerHTML = '<tr><td colspan="4">No enquiries yet.</td></tr>';
            return;
        }
        tbody.innerHTML = enquiries.slice(0, 5).map(e => `
          <tr>
            <td style="font-weight:500">${escapeHTML(e.student_username)}</td>
            <td style="color:var(--muted)">${escapeHTML(e.property_title)}</td>
            <td style="color:var(--muted)">${new Date(e.created_at).toLocaleDateString()}</td>
            <td><span class="tag ${e.status === 'OPEN' ? 'tag-pending' : 'tag-available'}">${e.status === 'OPEN' ? 'Open' : 'Replied'}</span></td>
          </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading enquiries:', error);
        tbody.innerHTML = '<tr><td colspan="4">Could not load enquiries right now.</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = await requireLandlord();
    if (!user) return;
    loadStats(user.id);
});

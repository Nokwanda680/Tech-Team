// Find My Vibe — Admin Listings moderation page
// Real data from /api/properties/ instead of hardcoded rows (Rosebank
// Cottage, Harbour View Studios, Durban Lofts #2, ...). Approve/reject
// PATCH the property's status, flag/unflag toggles is_flagged, delete
// removes the listing entirely.

const API_BASE = 'http://127.0.0.1:8000/api';
const ACCOUNTS_BASE = 'http://127.0.0.1:8000//api/accounts';

let allProperties = [];

const tbody = document.getElementById('listings-tbody');
const subtitleEl = document.getElementById('listings-subtitle');

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function initials(title) {
    return title.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

async function requireAdmin() {
    const response = await fetch(`${ACCOUNTS_BASE}/me/`, { credentials: 'include' });
    if (!response.ok) { window.location.href = '/front-end/login/Login.html'; return null; }
    const user = await response.json();
    if (user.role !== 'ADMIN') { window.location.href = '/front-end/login/Login.html'; return null; }
    return user;
}

function statusTag(property) {
    if (property.is_flagged) return '<span class="tag tag-flagged">Flagged</span>';
    if (property.status === 'PENDING') return '<span class="tag tag-review">Pending</span>';
    if (property.status === 'REJECTED') return '<span class="tag tag-suspended">Rejected</span>';
    return '<span class="tag tag-available">Live</span>';
}

function actionButtons(property) {
    const buttons = [];
    if (property.status === 'PENDING') {
        buttons.push(`<button class="btn btn-primary-admin approve-btn" data-id="${property.id}" style="padding:4px 10px; font-size:11px">Approve</button>`);
        buttons.push(`<button class="btn btn-ghost reject-btn" data-id="${property.id}" style="padding:4px 10px; font-size:11px">Reject</button>`);
    }
    buttons.push(`<button class="btn btn-ghost flag-btn" data-id="${property.id}" style="padding:4px 10px; font-size:11px">${property.is_flagged ? 'Unflag' : 'Flag'}</button>`);
    buttons.push(`<button class="btn btn-ghost delete-btn" data-id="${property.id}" style="padding:4px 10px; font-size:11px; color:var(--danger)">Delete</button>`);
    return buttons.join('');
}

function rowHTML(property) {
    return `
      <tr data-id="${property.id}">
        <td>
          <div style="display:flex; align-items:center; gap:10px">
            <div class="listing-img" style="width:34px; height:34px; background: var(--orange-dim); color: var(--orange);">${initials(property.title)}</div>
            <span style="font-weight:500">${escapeHTML(property.title)}</span>
          </div>
        </td>
        <td style="color:var(--muted)">${escapeHTML(property.landlord_username)}</td>
        <td>R ${Number(property.rent).toLocaleString()}/mo</td>
        <td style="color:var(--muted)">${new Date(property.created_at).toLocaleDateString()}</td>
        <td>${statusTag(property)}</td>
        <td><div style="display:flex; gap:6px">${actionButtons(property)}</div></td>
      </tr>
    `;
}

function attachActions() {
    tbody.querySelectorAll('.approve-btn').forEach(b => b.addEventListener('click', () => updateStatus(b.dataset.id, 'APPROVED')));
    tbody.querySelectorAll('.reject-btn').forEach(b => b.addEventListener('click', () => updateStatus(b.dataset.id, 'REJECTED')));
    tbody.querySelectorAll('.flag-btn').forEach(b => b.addEventListener('click', () => toggleFlag(b.dataset.id)));
    tbody.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', () => deleteProperty(b.dataset.id)));
}

function render(properties) {
    if (!properties.length) {
        tbody.innerHTML = '<tr><td colspan="6">No listings match this filter.</td></tr>';
        return;
    }
    tbody.innerHTML = properties.map(rowHTML).join('');
    attachActions();
}

function applyFilter(filter) {
    if (filter === 'ALL') { render(allProperties); return; }
    if (filter === 'FLAGGED') { render(allProperties.filter(p => p.is_flagged)); return; }
    render(allProperties.filter(p => p.status === filter && !p.is_flagged));
}

async function loadProperties() {
    try {
        const response = await fetch(`${API_BASE}/properties/?ordering=-created_at`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        allProperties = data.results !== undefined ? data.results : data;

        const pending = allProperties.filter(p => p.status === 'PENDING').length;
        subtitleEl.textContent = `${allProperties.length} total listings · ${pending} pending approval`;

        const activeChip = document.querySelector('.chip.active');
        applyFilter(activeChip ? activeChip.dataset.filter : 'PENDING');
    } catch (error) {
        console.error('Error loading properties:', error);
        tbody.innerHTML = '<tr><td colspan="6">Could not load listings right now.</td></tr>';
    }
}

async function updateStatus(id, status) {
    try {
        const response = await fetch(`${API_BASE}/properties/${id}/`, {
            method: 'PATCH',
            headers: csrfHeaders({ 'Content-Type': 'application/json' }),
            credentials: 'include',
            body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        loadProperties();
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Could not update this listing.');
    }
}

async function toggleFlag(id) {
    const property = allProperties.find(p => String(p.id) === String(id));
    try {
        const response = await fetch(`${API_BASE}/properties/${id}/`, {
            method: 'PATCH',
            headers: csrfHeaders({ 'Content-Type': 'application/json' }),
            credentials: 'include',
            body: JSON.stringify({ is_flagged: !property.is_flagged }),
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        loadProperties();
    } catch (error) {
        console.error('Error toggling flag:', error);
        alert('Could not update this listing.');
    }
}

async function deleteProperty(id) {
    if (!confirm('Delete this listing permanently?')) return;
    try {
        const response = await fetch(`${API_BASE}/properties/${id}/`, { method: 'DELETE', credentials: 'include', headers: csrfHeaders() });
        if (!response.ok && response.status !== 204) throw new Error(`Server returned ${response.status}`);
        loadProperties();
    } catch (error) {
        console.error('Error deleting property:', error);
        alert('Could not delete this listing.');
    }
}

document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyFilter(chip.dataset.filter);
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    const admin = await requireAdmin();
    if (!admin) return;
    loadProperties();
});

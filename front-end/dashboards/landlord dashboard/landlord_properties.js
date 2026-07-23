// Find My Vibe — Landlord "My Properties" page
// Full CRUD against the real API: list the landlord's own properties,
// add/edit via a modal form, upload images, delete, and toggle availability.
// Replaces the six hardcoded table rows (Sunset Apts, Garden Annex, ...)
// that used to be here.

const API_BASE = 'https://find-my-vibe.onrender.com/api';
const ACCOUNTS_BASE = 'https://find-my-vibe.onrender.com/api/accounts';

let myUserId = null;
let allProperties = [];

const tbody = document.getElementById('properties-tbody');
const subtitleEl = document.getElementById('properties-subtitle');

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function initials(title) {
    return title.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

async function requireLandlord() {
    const response = await fetch(`${ACCOUNTS_BASE}/me/`, { credentials: 'include' });
    if (!response.ok) {
        window.location.href = '/front-end/login/Login.html';
        return null;
    }
    const user = await response.json();
    if (user.role !== 'LANDLORD') {
        alert('This page is for landlords only.');
        window.location.href = '/front-end/login/Login.html';
        return null;
    }
    document.getElementById('user-name') && (document.getElementById('user-name').textContent = `${user.first_name} ${user.last_name}`.trim() || user.username);
    document.querySelector('.user-name') && (document.querySelector('.user-name').textContent = `${user.first_name} ${user.last_name}`.trim() || user.username);
    return user;
}

function rowHTML(property) {
    const statusTag = property.status !== 'APPROVED'
        ? `<span class="tag tag-pending">${property.status === 'PENDING' ? 'Pending approval' : 'Rejected'}</span>`
        : property.is_available
            ? '<span class="tag tag-available">Available</span>'
            : '<span class="tag tag-occupied">Unavailable</span>';

    return `
      <tr data-id="${property.id}">
        <td>
          <div style="display:flex; align-items:center; gap:10px">
            <div class="listing-img" style="width:38px; height:38px; background: var(--orange-dim); color: var(--orange);">${initials(property.title)}</div>
            <span style="font-weight:500">${escapeHTML(property.title)}</span>
          </div>
        </td>
        <td style="color:var(--muted)">${escapeHTML(property.location)}</td>
        <td>R ${Number(property.rent).toLocaleString()}/mo</td>
        <td>${statusTag}</td>
        <td style="color:var(--muted)">${property.favourites_count} favourite${property.favourites_count === 1 ? '' : 's'}</td>
        <td>
          <div style="display:flex; gap:6px">
            <button class="btn btn-ghost edit-btn" data-id="${property.id}" style="padding:4px 10px; font-size:11px">Edit</button>
            <button class="btn btn-ghost view-btn" data-id="${property.id}" style="padding:4px 10px; font-size:11px">View</button>
            <button class="btn btn-ghost delete-btn" data-id="${property.id}" style="padding:4px 10px; font-size:11px; color:var(--danger)">Delete</button>
          </div>
        </td>
      </tr>
    `;
}

function render(properties) {
    if (!properties.length) {
        tbody.innerHTML = '<tr><td colspan="6">You haven\'t listed any properties yet. Click "Add listing" to create your first one.</td></tr>';
        return;
    }
    tbody.innerHTML = properties.map(rowHTML).join('');

    tbody.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', () => {
        window.location.href = `/front-end/listings/property_detail.html?id=${btn.dataset.id}`;
    }));
    tbody.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.id)));
    tbody.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => deleteProperty(btn.dataset.id)));
}

function applyFilter(filter) {
    let filtered = allProperties;
    if (filter === 'available') filtered = allProperties.filter(p => p.is_available && p.status === 'APPROVED');
    if (filter === 'unavailable') filtered = allProperties.filter(p => !p.is_available && p.status === 'APPROVED');
    if (filter === 'pending') filtered = allProperties.filter(p => p.status !== 'APPROVED');
    render(filtered);
}

async function loadProperties() {
    try {
        const response = await fetch(`${API_BASE}/properties/?landlord=${myUserId}`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        allProperties = data.results !== undefined ? data.results : data;

        const availableCount = allProperties.filter(p => p.is_available && p.status === 'APPROVED').length;
        subtitleEl.textContent = `${allProperties.length} listing${allProperties.length === 1 ? '' : 's'} · ${availableCount} available`;

        const activeChip = document.querySelector('.chip.active');
        applyFilter(activeChip ? activeChip.dataset.filter : 'all');
    } catch (error) {
        console.error('Error loading properties:', error);
        tbody.innerHTML = '<tr><td colspan="6">Could not load your properties right now.</td></tr>';
    }
}

async function deleteProperty(id) {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    try {
        const response = await fetch(`${API_BASE}/properties/${id}/`, { method: 'DELETE', credentials: 'include', headers: csrfHeaders() });
        if (!response.ok && response.status !== 204) throw new Error(`Server returned ${response.status}`);
        loadProperties();
    } catch (error) {
        console.error('Error deleting property:', error);
        alert('Could not delete this listing.');
    }
}

// ── Add / edit modal ──────────────────────────────
const overlay = document.getElementById('listing-modal-overlay');
const form = document.getElementById('listing-form');
const statusEl = document.getElementById('listing-form-status');

function openModal(propertyId) {
    form.reset();
    statusEl.textContent = '';
    document.getElementById('listing-id').value = propertyId || '';
    document.getElementById('listing-modal-title').textContent = propertyId ? 'Edit listing' : 'Add listing';

    if (propertyId) {
        const property = allProperties.find(p => String(p.id) === String(propertyId));
        if (property) {
            document.getElementById('listing-title').value = property.title;
            document.getElementById('listing-description').value = property.description || '';
            document.getElementById('listing-rent').value = property.rent;
            document.getElementById('listing-room-type').value = property.room_type;
            document.getElementById('listing-location').value = property.location;
            document.getElementById('listing-university').value = property.university_nearby || '';
            document.getElementById('listing-distance').value = property.distance_from_campus_km || '';
            document.getElementById('listing-available').checked = property.is_available;
            document.getElementById('listing-rules').value = property.rules || '';
            document.getElementById('listing-contact-email').value = property.contact_email || '';
            document.getElementById('listing-contact-phone').value = property.contact_phone || '';
        }
    }
    overlay.classList.remove('hidden');
}

function closeModal() {
    overlay.classList.add('hidden');
}

document.getElementById('add-listing-btn').addEventListener('click', () => openModal(null));
document.getElementById('listing-modal-close').addEventListener('click', closeModal);
document.getElementById('listing-cancel-btn').addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('listing-id').value;
    const payload = {
        title: document.getElementById('listing-title').value,
        description: document.getElementById('listing-description').value,
        rent: document.getElementById('listing-rent').value,
        room_type: document.getElementById('listing-room-type').value,
        location: document.getElementById('listing-location').value,
        university_nearby: document.getElementById('listing-university').value,
        distance_from_campus_km: document.getElementById('listing-distance').value || null,
        is_available: document.getElementById('listing-available').checked,
        rules: document.getElementById('listing-rules').value,
        contact_email: document.getElementById('listing-contact-email').value,
        contact_phone: document.getElementById('listing-contact-phone').value,
    };

    try {
        const url = id ? `${API_BASE}/properties/${id}/` : `${API_BASE}/properties/`;
        const method = id ? 'PATCH' : 'POST';
        const response = await fetch(url, {
            method,
            headers: csrfHeaders({ 'Content-Type': 'application/json' }),
            credentials: 'include',
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            statusEl.textContent = 'Could not save listing: ' + JSON.stringify(err);
            return;
        }
        const saved = await response.json();
        await uploadImages(saved.id);
        closeModal();
        loadProperties();
    } catch (error) {
        console.error('Error saving listing:', error);
        statusEl.textContent = 'Could not save this listing. Please try again.';
    }
});

async function uploadImages(propertyId) {
    const fileInput = document.getElementById('listing-images');
    const files = Array.from(fileInput.files || []);
    for (const file of files) {
        const formData = new FormData();
        formData.append('property', propertyId);
        formData.append('image', file);
        try {
            await fetch(`${API_BASE}/property-images/`, {
                method: 'POST',
                credentials: 'include',
                headers: csrfHeaders(),
                body: formData,
            });
        } catch (error) {
            console.error('Error uploading image:', error);
        }
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
    const user = await requireLandlord();
    if (!user) return;
    myUserId = user.id;
    loadProperties();
});

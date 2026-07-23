// Find My Vibe — Admin Users page
// Replaces 6 hardcoded users (Zara Mokoena, James Davids, ...) with a real
// list from /api/accounts/admin/users/, including a "Vibe Score" column
// that had no backing model anywhere — removed rather than faked.

const ACCOUNTS_BASE = 'https://find-my-vibe.onrender.com/api/accounts';

let currentUrl = `${ACCOUNTS_BASE}/admin/users/`;
let roleFilter = '';
let searchTerm = '';

const tbody = document.getElementById('users-tbody');
const subtitleEl = document.getElementById('users-subtitle');
const paginationEl = document.getElementById('users-pagination');

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function initials(name) {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
}

async function requireAdmin() {
    const response = await fetch(`${ACCOUNTS_BASE}/me/`, { credentials: 'include' });
    if (!response.ok) {
        window.location.href = '/front-end/login/Login.html';
        return null;
    }
    const user = await response.json();
    if (user.role !== 'ADMIN') {
        window.location.href = '/front-end/login/Login.html';
        return null;
    }
    return user;
}

function rowHTML(user) {
    const avatarClass = user.role === 'STUDENT' ? 'avatar-student' : (user.role === 'LANDLORD' ? 'avatar-landlord' : 'avatar-admin');
    const statusTag = user.is_active
        ? '<span class="tag tag-available">Active</span>'
        : '<span class="tag tag-suspended">Suspended</span>';

    return `
      <tr data-id="${user.id}">
        <td>
          <div style="display:flex; align-items:center; gap:8px">
            <div class="avatar ${avatarClass}" style="width:28px; height:28px; font-size:10px;">${initials(user.full_name)}</div>
            <span style="font-weight:500">${escapeHTML(user.full_name)}</span>
          </div>
        </td>
        <td style="color:var(--muted)">${user.role.charAt(0) + user.role.slice(1).toLowerCase()}</td>
        <td style="color:var(--muted)">${new Date(user.date_joined).toLocaleDateString()}</td>
        <td>${statusTag}</td>
        <td>
          <div style="display:flex; gap:6px">
            <button class="btn btn-ghost toggle-btn" data-id="${user.id}" style="padding:4px 10px; font-size:11px">${user.is_active ? 'Suspend' : 'Unban'}</button>
            <button class="btn btn-ghost reset-btn" data-id="${user.id}" style="padding:4px 10px; font-size:11px">Reset password</button>
            <button class="btn btn-ghost delete-btn" data-id="${user.id}" style="padding:4px 10px; font-size:11px; color:var(--danger)">Delete</button>
          </div>
        </td>
      </tr>
    `;
}

function attachActions() {
    tbody.querySelectorAll('.toggle-btn').forEach(btn => btn.addEventListener('click', () => toggleActive(btn.dataset.id)));
    tbody.querySelectorAll('.reset-btn').forEach(btn => btn.addEventListener('click', () => resetPassword(btn.dataset.id)));
    tbody.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => deleteUser(btn.dataset.id)));
}

async function loadUsers(url) {
    const target = new URL(url);
    if (roleFilter) target.searchParams.set('role', roleFilter); else target.searchParams.delete('role');
    if (searchTerm) target.searchParams.set('search', searchTerm); else target.searchParams.delete('search');

    try {
        const response = await fetch(target.toString(), { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const results = data.results !== undefined ? data.results : data;
        const count = data.count !== undefined ? data.count : results.length;

        subtitleEl.textContent = `${count} total user${count === 1 ? '' : 's'}`;

        if (!results.length) {
            tbody.innerHTML = '<tr><td colspan="5">No users match this filter.</td></tr>';
        } else {
            tbody.innerHTML = results.map(rowHTML).join('');
            attachActions();
        }

        paginationEl.innerHTML = '';
        if (data.previous) {
            paginationEl.innerHTML += `<div class="page-btn" id="prev-page-btn"><i class="ti ti-chevron-left" aria-hidden="true"></i></div>`;
        }
        if (data.next) {
            paginationEl.innerHTML += `<div class="page-btn" id="next-page-btn"><i class="ti ti-chevron-right" aria-hidden="true"></i></div>`;
        }
        document.getElementById('prev-page-btn')?.addEventListener('click', () => loadUsers(data.previous));
        document.getElementById('next-page-btn')?.addEventListener('click', () => loadUsers(data.next));

        currentUrl = target.toString();
    } catch (error) {
        console.error('Error loading users:', error);
        tbody.innerHTML = '<tr><td colspan="5">Could not load users right now.</td></tr>';
    }
}

async function toggleActive(id) {
    try {
        const response = await fetch(`${ACCOUNTS_BASE}/admin/users/${id}/toggle_active/`, {
            method: 'POST',
            credentials: 'include',
                    headers: csrfHeaders(),
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        loadUsers(currentUrl);
    } catch (error) {
        console.error('Error toggling user status:', error);
        alert('Could not update this user.');
    }
}

async function resetPassword(id) {
    if (!confirm('Generate a new temporary password for this user?')) return;
    try {
        const response = await fetch(`${ACCOUNTS_BASE}/admin/users/${id}/reset_password/`, {
            method: 'POST',
            credentials: 'include',
                    headers: csrfHeaders(),
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        alert(`Temporary password: ${data.temporary_password}\n\nShare this with the user securely — it won't be shown again.`);
    } catch (error) {
        console.error('Error resetting password:', error);
        alert('Could not reset this user\'s password.');
    }
}

async function deleteUser(id) {
    if (!confirm('Delete this user account? This cannot be undone.')) return;
    try {
        const response = await fetch(`${ACCOUNTS_BASE}/admin/users/${id}/`, {
            method: 'DELETE',
            credentials: 'include',
                    headers: csrfHeaders(),
        });
        if (!response.ok && response.status !== 204) throw new Error(`Server returned ${response.status}`);
        loadUsers(currentUrl);
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Could not delete this user.');
    }
}

document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        roleFilter = chip.dataset.role;
        loadUsers(`${ACCOUNTS_BASE}/admin/users/`);
    });
});

let searchDebounce;
document.getElementById('users-search').addEventListener('input', (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
        searchTerm = e.target.value.trim();
        loadUsers(`${ACCOUNTS_BASE}/admin/users/`);
    }, 350);
});

document.addEventListener('DOMContentLoaded', async () => {
    const admin = await requireAdmin();
    if (!admin) return;
    loadUsers(currentUrl);
});

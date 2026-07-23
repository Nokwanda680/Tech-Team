// Find My Vibe — Student "My Profile" page
// NOTE: this replaces the old Set-B "account.html". That page already had
// real-looking form fields (first/last name, email, phone, bio) but no
// save button that did anything, plus a fake "ID document verified" /
// "Proof of enrollment" panel with no backing model - dropped that panel
// rather than fake it. This page wires the form to two new backend
// endpoints: POST /api/accounts/me/update/ (profile + avatar) and
// POST /api/accounts/me/change-password/.

const ACCOUNTS_BASE = 'https://find-my-vibe.onrender.com/api/accounts';

function initials(name) {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
}

async function loadProfile() {
    const response = await fetch(`${ACCOUNTS_BASE}/me/`, { credentials: 'include' });
    if (!response.ok) { window.location.href = '/front-end/login/Login.html'; return null; }
    const user = await response.json();
    if (user.role !== 'STUDENT') { window.location.href = '/front-end/login/Login.html'; return null; }

    const fullName = `${user.first_name} ${user.last_name}`.trim() || user.username;
    document.getElementById('user-name').textContent = fullName;
    document.getElementById('user-role-label').textContent = `Student${user.institution ? ' · ' + user.institution : ''}`;
    document.getElementById('user-avatar').textContent = initials(fullName);

    document.getElementById('profile-first-name').value = user.first_name || '';
    document.getElementById('profile-last-name').value = user.last_name || '';
    document.getElementById('profile-email').value = user.email || '';
    document.getElementById('profile-phone').value = user.phone_number || '';
    document.getElementById('profile-bio').value = user.bio || '';

    const avatarPreview = document.getElementById('profile-avatar-preview');
    if (user.avatar) {
        avatarPreview.style.backgroundImage = `url(${user.avatar})`;
        avatarPreview.style.backgroundSize = 'cover';
        avatarPreview.textContent = '';
    } else {
        avatarPreview.textContent = initials(fullName);
    }
    return user;
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('profile-form-status') || document.getElementById('profile-status');
    const formData = new FormData();
    formData.append('first_name', document.getElementById('profile-first-name').value);
    formData.append('last_name', document.getElementById('profile-last-name').value);
    formData.append('phone_number', document.getElementById('profile-phone').value);
    formData.append('bio', document.getElementById('profile-bio').value);

    const avatarFile = document.getElementById('profile-avatar-input').files[0];
    if (avatarFile) formData.append('avatar', avatarFile);

    try {
        const response = await fetch(`${ACCOUNTS_BASE}/me/update/`, {
            method: 'POST',
            credentials: 'include',
            headers: csrfHeaders(), // no Content-Type - browser sets the multipart boundary itself
            body: formData,
        });
        const data = await response.json();
        status.textContent = data.success ? 'Profile updated!' : (data.message || 'Could not update profile.');
        if (data.success) loadProfile();
    } catch (error) {
        console.error('Error updating profile:', error);
        status.textContent = 'Could not update profile.';
    }
});

document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('password-status');
    const oldPassword = document.getElementById('pw-current').value;
    const newPassword = document.getElementById('pw-new').value;

    try {
        const response = await fetch(`${ACCOUNTS_BASE}/me/change-password/`, {
            method: 'POST',
            credentials: 'include',
            headers: csrfHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
        });
        const data = await response.json();
        status.textContent = data.message || (data.success ? 'Password changed.' : 'Could not change password.');
        if (data.success) document.getElementById('password-form').reset();
    } catch (error) {
        console.error('Error changing password:', error);
        status.textContent = 'Could not change password.';
    }
});

document.addEventListener('DOMContentLoaded', loadProfile);

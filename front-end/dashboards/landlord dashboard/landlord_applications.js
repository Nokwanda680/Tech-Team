// Find My Vibe — Landlord Enquiries page
// NOTE: this page used to show a fake "tenant applications" workflow with
// a "Vibe Score" and Approve/Decline/lease actions — none of that has a
// backing model (no Application, no VibeScore, no lease concept anywhere
// in the real backend). What the brief and the real Enquiry model actually
// support is a simple enquiry inbox: a student messages about a property,
// the landlord replies. Rebuilt this page around that instead of faking
// the old workflow.

const API_BASE = 'https://find-my-vibe.onrender.com/api';
const ACCOUNTS_BASE = 'https://find-my-vibe.onrender.com/api/accounts';

let allEnquiries = [];

const tbody = document.getElementById('enquiries-tbody');
const subtitleEl = document.getElementById('enquiries-subtitle');

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
    if (!response.ok) {
        window.location.href = '/front-end/login/Login.html';
        return null;
    }
    const user = await response.json();
    if (user.role !== 'LANDLORD') {
        window.location.href = '/front-end/login/Login.html';
        return null;
    }
    return user;
}

function rowHTML(enquiry) {
    const statusTag = enquiry.status === 'OPEN'
        ? '<span class="tag tag-pending">Open</span>'
        : '<span class="tag tag-available">Replied</span>';

    return `
      <tr data-id="${enquiry.id}">
        <td>
          <div style="display:flex; align-items:center; gap:8px">
            <div class="avatar avatar-student" style="width:28px; height:28px; font-size:10px;">${initials(enquiry.student_username)}</div>
            <span style="font-weight:500">${escapeHTML(enquiry.student_username)}</span>
          </div>
        </td>
        <td style="color:var(--muted)">${escapeHTML(enquiry.property_title)}</td>
        <td style="color:var(--muted); max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(enquiry.message)}</td>
        <td style="color:var(--muted)">${new Date(enquiry.created_at).toLocaleDateString()}</td>
        <td>${statusTag}</td>
        <td>
          <div style="display:flex; gap:6px">
            <button class="btn btn-primary-landlord reply-btn" data-id="${enquiry.id}" style="padding:4px 10px; font-size:11px">${enquiry.status === 'OPEN' ? 'Reply' : 'View reply'}</button>
          </div>
        </td>
      </tr>
    `;
}

function render(enquiries) {
    if (!enquiries.length) {
        tbody.innerHTML = '<tr><td colspan="6">No enquiries yet.</td></tr>';
        return;
    }
    tbody.innerHTML = enquiries.map(rowHTML).join('');
    tbody.querySelectorAll('.reply-btn').forEach(btn => btn.addEventListener('click', () => openReplyModal(btn.dataset.id)));
}

function applyFilter(filter) {
    if (filter === 'all') {
        render(allEnquiries);
    } else {
        render(allEnquiries.filter(e => e.status === filter));
    }
}

async function loadEnquiries() {
    try {
        const response = await fetch(`${API_BASE}/enquiries/`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        allEnquiries = data.results !== undefined ? data.results : data;

        const openCount = allEnquiries.filter(e => e.status === 'OPEN').length;
        subtitleEl.textContent = `${allEnquiries.length} enquir${allEnquiries.length === 1 ? 'y' : 'ies'} · ${openCount} awaiting your reply`;
        const badge = document.getElementById('nav-enquiries-badge');
        if (badge) badge.textContent = openCount;

        const activeChip = document.querySelector('.chip.active');
        applyFilter(activeChip ? activeChip.dataset.filter : 'all');
    } catch (error) {
        console.error('Error loading enquiries:', error);
        tbody.innerHTML = '<tr><td colspan="6">Could not load enquiries right now.</td></tr>';
    }
}

// ── Reply modal ──────────────────────────────
const overlay = document.getElementById('reply-modal-overlay');
const form = document.getElementById('reply-form');

function openReplyModal(enquiryId) {
    const enquiry = allEnquiries.find(e => String(e.id) === String(enquiryId));
    if (!enquiry) return;
    document.getElementById('reply-enquiry-id').value = enquiry.id;
    document.getElementById('reply-original-message').textContent = `"${enquiry.message}" — ${enquiry.student_username}`;
    document.getElementById('reply-text').value = enquiry.landlord_reply || '';
    document.getElementById('reply-status').textContent = '';
    overlay.classList.remove('hidden');
}

function closeReplyModal() {
    overlay.classList.add('hidden');
}

document.getElementById('reply-modal-close').addEventListener('click', closeReplyModal);
document.getElementById('reply-cancel-btn').addEventListener('click', closeReplyModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeReplyModal(); });

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('reply-enquiry-id').value;
    const reply = document.getElementById('reply-text').value.trim();
    const statusEl = document.getElementById('reply-status');
    if (!reply) return;
    try {
        const response = await fetch(`${API_BASE}/enquiries/${id}/reply/`, {
            method: 'POST',
            headers: csrfHeaders({ 'Content-Type': 'application/json' }),
            credentials: 'include',
            body: JSON.stringify({ reply }),
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        statusEl.textContent = 'Reply sent!';
        await loadEnquiries();
        setTimeout(closeReplyModal, 700);
    } catch (error) {
        console.error('Error sending reply:', error);
        statusEl.textContent = 'Could not send reply. Please try again.';
    }
});

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
    loadEnquiries();
});

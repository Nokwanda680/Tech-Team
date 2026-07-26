// Find My Vibe — Student "My Enquiries" page
// NOTE: this replaces the old Set-B "applications.html", which tracked a
// fake tenant-application workflow (property/landlord/rent/status/"next
// step") with no backing model. What actually exists is the real Enquiry
// model, scoped to the logged-in student by the API automatically. This
// is the student-facing equivalent of the landlord's enquiry reply page
// and the admin's platform-wide enquiry oversight page.

const API_BASE = 'https://find-my-vibe.onrender.com/api';
const ACCOUNTS_BASE = 'https://find-my-vibe.onrender.com/api/accounts';

let allEnquiries = [];

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
    return user;
}

function rowHTML(enquiry) {
    const statusTag = enquiry.status === 'OPEN'
        ? '<span class="tag tag-pending">Awaiting reply</span>'
        : '<span class="tag tag-available">Replied</span>';
    return `
      <tr>
        <td style="font-weight:500">${escapeHTML(enquiry.property_title)}</td>
        <td style="color:var(--muted); max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(enquiry.message)}</td>
        <td style="color:var(--muted); max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${enquiry.landlord_reply ? escapeHTML(enquiry.landlord_reply) : '<em>No reply yet</em>'}</td>
        <td style="color:var(--muted)">${new Date(enquiry.created_at).toLocaleDateString()}</td>
        <td>${statusTag}</td>
      </tr>
    `;
}

function render(enquiries) {
    const tbody = document.getElementById('enquiries-tbody');
    tbody.innerHTML = enquiries.length
        ? enquiries.map(rowHTML).join('')
        : '<tr><td colspan="5">No enquiries in this category yet.</td></tr>';
}

function applyFilter(filter) {
    render(filter === 'ALL' ? allEnquiries : allEnquiries.filter(e => e.status === filter));
}

async function loadEnquiries() {
    try {
        const response = await fetch(`${API_BASE}/enquiries/`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        allEnquiries = data.results !== undefined ? data.results : data;

        const open = allEnquiries.filter(e => e.status === 'OPEN').length;
        document.getElementById('enquiries-subtitle').textContent =
            `${allEnquiries.length} enquir${allEnquiries.length === 1 ? 'y' : 'ies'} sent · ${open} awaiting a reply`;

        const activeChip = document.querySelector('.chip.active');
        applyFilter(activeChip ? activeChip.dataset.filter : 'ALL');
    } catch (error) {
        console.error('Error loading enquiries:', error);
        document.getElementById('enquiries-tbody').innerHTML = '<tr><td colspan="5">Could not load your enquiries right now.</td></tr>';
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
    const user = await requireStudent();
    if (!user) return;
    loadEnquiries();
});

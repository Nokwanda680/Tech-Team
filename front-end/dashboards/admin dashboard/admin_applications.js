// Find My Vibe — Admin Enquiries oversight page
// NOTE: this used to show a fake tenant-application workflow (Applicant/
// Property/Landlord/Applied/Status with an approve/decline concept) with
// no backing model, same issue as the landlord-side "Applications" page.
// Rebuilt as a read-only platform-wide view of real Enquiry records, since
// admins can already see every enquiry via the API (EnquiryViewSet returns
// everything for admin users) - this is useful oversight without
// duplicating the landlord's own reply workflow.

const API_BASE = 'http://127.0.0.1:8000/api';
const ACCOUNTS_BASE = 'http://127.0.0.1:8000/api/accounts';

let allEnquiries = [];
const tbody = document.getElementById('enquiries-tbody');
const subtitleEl = document.getElementById('enquiries-subtitle');

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function requireAdmin() {
    const response = await fetch(`${ACCOUNTS_BASE}/me/`, { credentials: 'include' });
    if (!response.ok) { window.location.href = '/front-end/login/Login.html'; return null; }
    const user = await response.json();
    if (user.role !== 'ADMIN') { window.location.href = '/front-end/login/Login.html'; return null; }
    return user;
}

function rowHTML(enquiry) {
    const statusTag = enquiry.status === 'OPEN'
        ? '<span class="tag tag-review">Open</span>'
        : '<span class="tag tag-available">Replied</span>';
    return `
      <tr>
        <td>${escapeHTML(enquiry.student_username)}</td>
        <td style="color:var(--muted)">${escapeHTML(enquiry.property_title)}</td>
        <td style="color:var(--muted)">${escapeHTML(enquiry.landlord_username)}</td>
        <td style="color:var(--muted)">${new Date(enquiry.created_at).toLocaleDateString()}</td>
        <td>${statusTag}</td>
      </tr>
    `;
}

function render(enquiries) {
    tbody.innerHTML = enquiries.length
        ? enquiries.map(rowHTML).join('')
        : '<tr><td colspan="5">No enquiries in this category.</td></tr>';
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

        const openCount = allEnquiries.filter(e => e.status === 'OPEN').length;
        subtitleEl.textContent = `${allEnquiries.length} enquiries platform-wide · ${openCount} still open`;

        const activeChip = document.querySelector('.chip.active');
        applyFilter(activeChip ? activeChip.dataset.filter : 'ALL');
    } catch (error) {
        console.error('Error loading enquiries:', error);
        tbody.innerHTML = '<tr><td colspan="5">Could not load enquiries right now.</td></tr>';
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
    loadEnquiries();
});

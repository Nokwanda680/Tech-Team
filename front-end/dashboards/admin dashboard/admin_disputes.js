// Find My Vibe — Admin Reports page
// NOTE: the old "Disputes" page showed things like assignee, priority, and
// narrative dispute types ("deposit dispute", "noise complaint") — none of
// which have a backing model (no assignee/priority field on Report, no
// dispute-between-two-parties concept anywhere in the backend). What
// actually exists is the Report model: someone reports a property or user,
// with a reason/description, and an admin marks it reviewed or dismissed.
// Rebuilt around that instead of faking the richer workflow.

const API_BASE = 'http://127.0.0.1:8000/api';
const ACCOUNTS_BASE = 'http://127.0.0.1:8000/api/accounts';

let allReports = [];

const grid = document.getElementById('reports-grid');
const subtitleEl = document.getElementById('reports-subtitle');

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

function targetLabel(report) {
    if (report.target_type === 'PROPERTY') return `Property #${report.reported_property}`;
    return `User #${report.reported_user}`;
}

function cardHTML(report) {
    const isOpen = report.status === 'OPEN';
    return `
      <div class="card" data-id="${report.id}">
        <div class="card-header">
          <span class="card-title">${escapeHTML(report.reason)} — ${targetLabel(report)}</span>
          <span class="tag ${isOpen ? 'tag-urgent' : 'tag-available'}">${report.status}</span>
        </div>
        <div style="font-size:12.5px; color:var(--muted); margin-bottom:10px">
          Reported ${new Date(report.created_at).toLocaleDateString()} by ${escapeHTML(report.reporter_username)}
        </div>
        <div style="font-size:13px; line-height:1.5; margin-bottom:14px">${escapeHTML(report.description) || '<em>No further details provided.</em>'}</div>
        ${isOpen ? `
          <div style="display:flex; align-items:center; justify-content:flex-end; gap:8px">
            <button class="btn btn-ghost dismiss-btn" data-id="${report.id}" style="padding:6px 12px; font-size:11px">Dismiss</button>
            <button class="btn btn-primary-admin review-btn" data-id="${report.id}" style="padding:6px 12px; font-size:11px">Mark reviewed</button>
          </div>
        ` : ''}
      </div>
    `;
}

function render(reports) {
    if (!reports.length) {
        grid.innerHTML = '<p>No reports in this category.</p>';
        return;
    }
    grid.innerHTML = reports.map(cardHTML).join('');
    grid.querySelectorAll('.review-btn').forEach(b => b.addEventListener('click', () => setStatus(b.dataset.id, 'REVIEWED')));
    grid.querySelectorAll('.dismiss-btn').forEach(b => b.addEventListener('click', () => setStatus(b.dataset.id, 'DISMISSED')));
}

function applyFilter(filter) {
    render(allReports.filter(r => r.status === filter));
}

async function loadReports() {
    try {
        const response = await fetch(`${API_BASE}/reports/`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        allReports = data.results !== undefined ? data.results : data;

        const openCount = allReports.filter(r => r.status === 'OPEN').length;
        subtitleEl.textContent = `${openCount} open report${openCount === 1 ? '' : 's'} · ${allReports.length} total`;

        const activeChip = document.querySelector('.chip.active');
        applyFilter(activeChip ? activeChip.dataset.filter : 'OPEN');
    } catch (error) {
        console.error('Error loading reports:', error);
        grid.innerHTML = '<p>Could not load reports right now.</p>';
    }
}

async function setStatus(id, status) {
    try {
        const response = await fetch(`${API_BASE}/reports/${id}/`, {
            method: 'PATCH',
            headers: csrfHeaders({ 'Content-Type': 'application/json' }),
            credentials: 'include',
            body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        loadReports();
    } catch (error) {
        console.error('Error updating report:', error);
        alert('Could not update this report.');
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
    loadReports();
});

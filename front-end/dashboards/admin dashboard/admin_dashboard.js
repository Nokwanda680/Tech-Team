// Find My Vibe — Admin overview page
// Wires the top 4 stat cards to /api/admin/stats/, replacing hardcoded
// numbers (including a fake "Placements: 762" figure with no backing
// model, and a "Disputes: 3" figure from the old fake-dispute workflow).
//
// Also replaces a chunk of fake content further down the page that got
// missed in an earlier pass: a fully hardcoded "Platform activity" feed
// ("James Davids verified", "118 new applications processed"), a
// duplicate fake "Listing approval queue" table, a duplicate fake user-
// breakdown donut chart, and a "System health" card presenting fabricated
// infrastructure status (API uptime %, "search engine: operational") as
// if it were real monitoring data - there's no monitoring system anywhere
// in this project, so that card is removed rather than left claiming
// things that aren't true.

const API_BASE = 'http://127.0.0.1:8000/api';
const ACCOUNTS_BASE = 'http://127.0.0.1:8000/api/accounts';
const CIRCUMFERENCE = 2 * Math.PI * 40;

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

function setDonutSegment(el, fraction, offsetFraction) {
    const length = fraction * CIRCUMFERENCE;
    el.setAttribute('stroke-dasharray', `${length.toFixed(1)} ${(CIRCUMFERENCE - length).toFixed(1)}`);
    el.setAttribute('stroke-dashoffset', `${(-offsetFraction * CIRCUMFERENCE).toFixed(1)}`);
}

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/admin/stats/`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const s = await response.json();
        const totalUsers = s.total_students + s.total_landlords + s.total_admins;

        document.getElementById('ov-total-users').textContent = totalUsers.toLocaleString();
        document.getElementById('ov-users-meta').textContent = `${s.suspended_users} suspended`;
        document.getElementById('ov-total-listings').textContent = s.total_properties.toLocaleString();
        document.getElementById('ov-listings-meta').textContent = `${s.pending_properties} pending approval`;
        document.getElementById('ov-total-favourites').textContent = s.total_favourites.toLocaleString();
        document.getElementById('ov-open-reports').textContent = s.open_reports.toLocaleString();
        document.getElementById('ov-pending-count').textContent = `${s.pending_properties} pending`;

        const subtitle = document.getElementById('overview-subtitle');
        if (subtitle) {
            subtitle.textContent = s.open_reports > 0
                ? `Find My Vibe is running normally. ${s.open_reports} report${s.open_reports === 1 ? '' : 's'} need your attention.`
                : 'Find My Vibe is running normally. No open reports.';
        }

        if (totalUsers > 0) {
            const studentFrac = s.total_students / totalUsers;
            const landlordFrac = s.total_landlords / totalUsers;
            const adminFrac = s.total_admins / totalUsers;
            setDonutSegment(document.getElementById('donut-students'), studentFrac, 0);
            setDonutSegment(document.getElementById('donut-landlords'), landlordFrac, studentFrac);
            setDonutSegment(document.getElementById('donut-admins'), adminFrac, studentFrac + landlordFrac);
        }
        document.getElementById('donut-total-text').textContent = totalUsers.toLocaleString();
        document.getElementById('legend-students').textContent = s.total_students.toLocaleString();
        document.getElementById('legend-landlords').textContent = s.total_landlords.toLocaleString();
        document.getElementById('legend-admins').textContent = s.total_admins.toLocaleString();
    } catch (error) {
        console.error('Error loading platform stats:', error);
    }
}

async function loadRecentReports() {
    const container = document.getElementById('ov-recent-reports');
    try {
        const response = await fetch(`${API_BASE}/reports/`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const reports = data.results !== undefined ? data.results : data;
        const openReports = reports.filter(r => r.status === 'OPEN').slice(0, 4);

        if (!openReports.length) {
            container.innerHTML = '<p style="color:var(--muted); font-size:13px;">No open reports.</p>';
            return;
        }
        container.innerHTML = openReports.map(r => `
          <div class="activity-item">
            <div class="activity-dot" style="background:var(--danger)"></div>
            <div class="activity-content">
              <div class="activity-text"><b>${escapeHTML(r.reason)}</b> — reported by ${escapeHTML(r.reporter_username)}</div>
              <div class="activity-time">${new Date(r.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recent reports:', error);
        container.innerHTML = '<p style="color:var(--muted); font-size:13px;">Could not load reports right now.</p>';
    }
}

async function loadApprovalQueue() {
    const tbody = document.getElementById('ov-approval-queue');
    try {
        const response = await fetch(`${API_BASE}/properties/?status=PENDING`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const pending = data.results !== undefined ? data.results : data;

        if (!pending.length) {
            tbody.innerHTML = '<tr><td colspan="6">No listings awaiting approval.</td></tr>';
            return;
        }
        tbody.innerHTML = pending.slice(0, 5).map(p => `
          <tr>
            <td style="font-weight:500">${escapeHTML(p.title)}</td>
            <td style="color:var(--muted)">${escapeHTML(p.landlord_username)}</td>
            <td style="color:var(--muted)">${escapeHTML(p.location)}</td>
            <td>R ${Number(p.rent).toLocaleString()}/mo</td>
            <td style="color:var(--muted)">${new Date(p.created_at).toLocaleDateString()}</td>
            <td><button class="btn btn-primary-admin" style="padding:4px 10px; font-size:11px" onclick="window.location.href='admin_listings.html'">Review</button></td>
          </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading approval queue:', error);
        tbody.innerHTML = '<tr><td colspan="6">Could not load the approval queue right now.</td></tr>';
    }
}

async function loadNotifications() {
    const container = document.getElementById('ov-notifications');
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
            <div class="activity-dot" style="background: ${n.is_read ? 'var(--muted)' : 'var(--blue)'}"></div>
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
    const admin = await requireAdmin();
    if (!admin) return;
    loadStats();
    loadRecentReports();
    loadApprovalQueue();
    loadNotifications();
});

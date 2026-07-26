// Find My Vibe — Admin Analytics page
// Wires the top 4 stat cards and the user-breakdown donut chart to real
// counts from /api/admin/stats/, replacing hardcoded numbers (including
// "Placements: 762" and "Avg. Vibe Score: 81", neither of which has any
// backing model, now replaced with real listing/enquiry/report counts).
// The "Weekly signups" bar chart and "Funnel performance" section are left
// as-is (flagged inline in the HTML) — they'd need signup-date and
// funnel-step tracking that doesn't exist anywhere in this backend yet.

const API_BASE = 'https://find-my-vibe.onrender.com/api';
const ACCOUNTS_BASE = 'https://find-my-vibe.onrender.com/api/accounts';
const CIRCUMFERENCE = 2 * Math.PI * 40; // r=40 per the SVG markup

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

        document.getElementById('stat-total-users').textContent = totalUsers.toLocaleString();
        document.getElementById('stat-users-meta').textContent = `${s.suspended_users} suspended`;

        document.getElementById('stat-total-listings').textContent = s.total_properties.toLocaleString();
        document.getElementById('stat-listings-meta').textContent = `${s.pending_properties} pending approval`;

        document.getElementById('stat-total-enquiries').textContent = s.total_enquiries.toLocaleString();
        document.getElementById('stat-enquiries-meta').textContent = `${s.open_enquiries} awaiting reply`;

        document.getElementById('stat-open-reports').textContent = s.open_reports.toLocaleString();

        // Donut chart — real proportions from actual role counts
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

document.addEventListener('DOMContentLoaded', async () => {
    const admin = await requireAdmin();
    if (!admin) return;
    loadStats();
});

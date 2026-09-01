/**
 * Find My Vibe — Dashboard JS
 *
 * Role data is injected from Django via the `dashboard_roles` global,
 * set in the template with:
 *   <script>const dashboard_roles = {{ roles_json|safe }};</script>
 *
 * The initial role is set via `dashboard_initial_role`:
 *   <script>const dashboard_initial_role = "{{ current_role }}";</script>
 */

const roles = (typeof dashboard_roles !== 'undefined') ? dashboard_roles : {
  student: {
    name: 'Zara Mokoena',
    initials: 'ZM',
    roleLabel: 'Student · UCT',
    avatarClass: 'avatar-student',
    topbarTitle: 'My Dashboard',
    nav: [
      { icon: 'ti-layout-dashboard', label: 'Dashboard', active: true },
      { icon: 'ti-search',           label: 'Find housing' },
      { icon: 'ti-heart',            label: 'Saved listings', badge: 14 },
      { icon: 'ti-file-text',        label: 'My applications', badge: 2 },
      { icon: 'ti-calendar',         label: 'Viewings' },
      { icon: 'ti-message',          label: 'Messages', badge: 1 },
      null,
      { icon: 'ti-user',             label: 'My profile' },
      { icon: 'ti-adjustments-horizontal', label: 'Preferences' },
    ]
  },
  landlord: {
    name: 'James Davids',
    initials: 'JD',
    roleLabel: 'Landlord',
    avatarClass: 'avatar-landlord',
    topbarTitle: 'Landlord Portal',
    nav: [
      { icon: 'ti-layout-dashboard', label: 'Overview', active: true },
      { icon: 'ti-building',         label: 'My properties' },
      { icon: 'ti-users',            label: 'Applications', badge: 7 },
      { icon: 'ti-chart-bar',        label: 'Revenue' },
      { icon: 'ti-tool',             label: 'Maintenance', badge: 1 },
      { icon: 'ti-message',          label: 'Messages' },
      null,
      { icon: 'ti-user',             label: 'My account' },
      { icon: 'ti-file-invoice',     label: 'Documents' },
    ]
  },
  admin: {
    name: 'Admin User',
    initials: 'AU',
    roleLabel: 'Platform Admin',
    avatarClass: 'avatar-admin',
    topbarTitle: 'Admin Control',
    nav: [
      { icon: 'ti-layout-dashboard', label: 'Dashboard', active: true },{ icon: 'ti-users',            label: 'Users', badge: 134 },
      { icon: 'ti-building',         label: 'Listings', badge: 38 },{ icon: 'ti-clipboard-list',   label: 'Applications' },
      { icon: 'ti-alert-triangle',   label: 'Disputes', badge: 3 },{ icon: 'ti-activity',         label: 'Analytics' },null,
      { icon: 'ti-shield',           label: 'Moderation' },{ icon: 'ti-settings',         label: 'Settings' },
    ]
  }
};
let currentRole = (typeof dashboard_initial_role !== 'undefined') ? dashboard_initial_role : 'student';
function switchRole(role) {
  currentRole = role;
  const app = document.getElementById('app');
  app.className = 'app role-' + role;
  document.querySelectorAll('.role-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.role === role);
  });
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + role).classList.add('active');
  renderNav(role);
  renderUser(role);
  document.getElementById('topbar-title').textContent = roles[role].topbarTitle;
}
function renderNav(role) {
  const nav = document.getElementById('nav');
  nav.innerHTML = '';
  roles[role].nav.forEach(item => {
    if (item === null) {
      const lbl = document.createElement('div');
      lbl.className = 'nav-section-label';
      lbl.textContent = 'Account';
      nav.appendChild(lbl);
      return;
    }
    const el = document.createElement('div');
    el.className = 'nav-item' + (item.active ? ' active' : '');
    el.innerHTML =
      `<i class="ti ${item.icon}" aria-hidden="true"></i><span>${item.label}</span>` +
      (item.badge ? `<span class="nav-badge">${item.badge > 99 ? '99+' : item.badge}</span>` : '');
    el.onclick = () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      el.classList.add('active');
    };
    nav.appendChild(el);
  });
}
function renderUser(role) {
  const r = roles[role];
  document.getElementById('user-card').innerHTML = `
    <div class="avatar ${r.avatarClass}">${r.initials}</div>
    <div class="user-info">
      <div class="user-name">${r.name}</div>
      <div class="user-role-label">${r.roleLabel}</div>
    </div>
    <i class="ti ti-chevron-down" style="font-size:14px; color:var(--muted)" aria-hidden="true"></i>
  `;
}
function buildBarChart(chartId, labels, values, color, showValues) {
  const chart = document.getElementById(chartId);
  if (!chart) return;
  const max = Math.max(...values);
  chart.innerHTML = labels.map((label, i) => {
    const h = Math.round((values[i] / max) * 90);
    const isLast = i === labels.length - 1;
    const barColor = isLast ? `var(--${color})` : 'var(--surface-soft)';
    const barBorder = isLast ? `var(--${color})` : 'var(--border)';
    return `<div class="bar-col">
      ${showValues ? `<span class="bar-val" style="color:var(--${color}); font-size:10px">R${values[i]}k</span>` : ''}
      <div class="bar" style="height:${h}px; background:${barColor}; border:1px solid ${barBorder}"></div>
      <span class="bar-label">${label}</span>
    </div>`;
  }).join('');
}
renderNav(currentRole);
renderUser(currentRole);
buildBarChart(
  'rev-chart',
  ['Jan','Feb','Mar','Apr','May','Jun'],
  [32, 35, 31, 38, 36, 38],
  'orange',
  true
);
buildBarChart(
  'signup-chart',
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  [18, 24, 19, 31, 28, 12, 8],
  'lime',
  false
);

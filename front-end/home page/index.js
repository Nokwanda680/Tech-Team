// Find My Vibe — homepage
// Wires the hero search to the real listings page, pulls a live listing
// count from the public API for the hero stat pill (replacing the old
// page's empty, permanently-blank results counter), and shows 3 real
// recently-listed properties instead of the old hardcoded/commented-out
// fake cards.

const API_BASE = 'http://127.0.0.1:8000/api';

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Search bar routes to the real listings page with the query pre-filled,
// rather than trying to duplicate listings.html's filtering here.
document.getElementById('hero-search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('hero-search-input').value.trim();
    const url = '/front-end/listings/listings.html' + (query ? `?search=${encodeURIComponent(query)}` : '');
    window.location.href = url;
});

async function loadHeroStats() {
    const container = document.getElementById('hero-stats');
    try {
        const response = await fetch(`${API_BASE}/properties/`);
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const count = data.count !== undefined ? data.count : (data.results || data).length;
        const results = data.results !== undefined ? data.results : data;

        const campuses = new Set(results.map(p => p.university_nearby).filter(Boolean));

        container.innerHTML = `
          <span class="stat-pill"><span class="dot"></span> <strong>${count}</strong> verified listing${count === 1 ? '' : 's'} live</span>
          ${campuses.size ? `<span class="stat-pill"><strong>${campuses.size}</strong> campus${campuses.size === 1 ? '' : 'es'} covered</span>` : ''}
        `;
    } catch (error) {
        console.error('Error loading hero stats:', error);
        container.innerHTML = '';
    }
}

async function loadFeaturedListings() {
    const container = document.getElementById('featured-grid');
    try {
        const response = await fetch(`${API_BASE}/properties/?ordering=-created_at`);
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const properties = data.results !== undefined ? data.results : data;

        if (!properties.length) {
            container.innerHTML = '<p style="color:var(--muted)">No listings yet — check back soon, or be the first to <a href="/front-end/login/landlordsignup.html" style="color:var(--orange)">list a property</a>.</p>';
            return;
        }

        container.innerHTML = properties.slice(0, 3).map((property) => {
            const image = (property.images && property.images.length)
                ? (property.images.find(i => i.is_primary) || property.images[0]).image
                : '/front-end/Images/logo.jpg';
            const distance = property.distance_from_campus_km
                ? `${property.distance_from_campus_km}km from campus`
                : (property.university_nearby || property.location);

            return `
              <article class="card" onclick="window.location.href='/front-end/listings/property_detail.html?id=${property.id}'">
                <div class="card-media">
                  <img src="${image}" alt="${escapeHTML(property.title)}">
                  <span class="card-badge">${property.is_available ? 'Available now' : 'Unavailable'}</span>
                </div>
                <div class="card-body">
                  <div class="card-price"><span>R ${Number(property.rent).toLocaleString()}</span><small>/month</small></div>
                  <h4>${escapeHTML(property.title)}</h4>
                  <div class="card-location">
                    <p><img src="/front-end/Images/location.webp" alt="" height="30px" style="mix-blend-mode: multiply;"></p>
                    <p>${escapeHTML(distance)}</p>
                  </div>
                </div>
              </article>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading featured listings:', error);
        container.innerHTML = '<p style="color:var(--muted)">Could not load listings right now.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadHeroStats();
    loadFeaturedListings();
});

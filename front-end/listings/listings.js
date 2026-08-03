// Find My Vibe — listings page
// Fetches real properties from the Django API (/api/properties/) with
// server-side filtering, instead of the hardcoded static cards that used
// to live in listings.html. Also wires up favouriting for logged-in
// students via /api/properties/<id>/toggle_favourite/.

const API_BASE = 'http://127.0.0.1:8000//api';

const listingsGrid = document.getElementById('listings');
const resultsCount = document.getElementById('results-count');

function currentRole() {
    return localStorage.getItem('role');
}

function buildQuery() {
    const params = new URLSearchParams();

    const minRent = document.getElementById('min-rent').value.trim();
    const maxRent = document.getElementById('max-rent').value.trim();
    if (minRent) params.set('min_rent', minRent);
    if (maxRent) params.set('max_rent', maxRent);

    const checkedRoomTypes = Array.from(document.querySelectorAll('.room-type-filter:checked')).map(el => el.value);
    const allRoomTypes = document.querySelectorAll('.room-type-filter').length;
    // Only send room_type filter if the user has narrowed it down (not all/none checked),
    // since the API only supports a single room_type value at a time.
    if (checkedRoomTypes.length === 1) {
        params.set('room_type', checkedRoomTypes[0]);
    }

    const checkedAmenities = Array.from(document.querySelectorAll('.amenity-filter:checked')).map(el => el.value);
    if (checkedAmenities.length) {
        params.set('amenities', checkedAmenities.join(','));
    }

    const search = document.getElementById('hero-search').value.trim();
    if (search) params.set('search', search);

    return params.toString();
}

function propertyCardHTML(property) {
    const image = (property.images && property.images.length)
        ? (property.images.find(i => i.is_primary) || property.images[0]).image
        : '/Images/logo.jpg';

    const distance = property.distance_from_campus_km
        ? `${property.distance_from_campus_km}km from campus`
        : (property.university_nearby || property.location);

    const badge = property.is_available ? 'Available Now' : 'Currently Unavailable';
    const isStudent = currentRole() === 'STUDENT';

    return `
      <article class="card" data-property-id="${property.id}" onclick="window.location.href='property_detail.html?id=${property.id}'" style="cursor:pointer;">
        <div class="card-media">
          <img src="${image}" alt="${escapeHTML(property.title)}">
          <span class="card-badge">${badge}</span>
          ${isStudent ? `<button class="fav-btn" data-id="${property.id}" title="Save to favourites">♥</button>` : ''}
        </div>
        <div class="card-body">
          <div class="card-price"><span>R ${Number(property.rent).toLocaleString()}</span><small>/month</small></div>
          <h4>${escapeHTML(property.title)}</h4>
          <div class="card-location">
            <p><img src="/Images/location.webp" alt="" height="30px" style="mix-blend-mode: multiply;"></p>
            <p>${escapeHTML(distance)}</p>
          </div>
          ${property.average_rating ? `<p class="card-rating">★ ${Number(property.average_rating).toFixed(1)}</p>` : ''}
        </div>
      </article>
    `;
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function loadListings() {
    listingsGrid.innerHTML = '<p id="listings-loading">Loading listings…</p>';
    try {
        const query = buildQuery();
        const response = await fetch(`${API_BASE}/properties/${query ? '?' + query : ''}`, {
            credentials: 'include',
        });
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }
        const data = await response.json();
        // DRF pagination wraps results in {count, next, previous, results}
        const results = data.results !== undefined ? data.results : data;
        const count = data.count !== undefined ? data.count : results.length;

        resultsCount.textContent = count;

        if (!results.length) {
            listingsGrid.innerHTML = '<p>No properties match your filters yet. Try widening your search.</p>';
            return;
        }

        listingsGrid.innerHTML = results.map(propertyCardHTML).join('');
        attachFavouriteHandlers();
    } catch (error) {
        console.error('Error loading listings:', error);
        listingsGrid.innerHTML = '<p>Sorry, we could not load listings right now. Please try again shortly.</p>';
    }
}

function attachFavouriteHandlers() {
    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            try {
                const response = await fetch(`${API_BASE}/properties/${id}/toggle_favourite/`, {
                    method: 'POST',
                    credentials: 'include',
                                    headers: csrfHeaders(),
                });
                if (response.status === 401 || response.status === 403) {
                    alert('Please log in as a student to save favourites.');
                    return;
                }
                const data = await response.json();
                btn.classList.toggle('fav-btn-active', data.favourited);
            } catch (error) {
                console.error('Error toggling favourite:', error);
            }
        });
    });
}

document.getElementById('apply-filters-btn').addEventListener('click', loadListings);
document.getElementById('hero-search-btn').addEventListener('click', loadListings);
document.getElementById('hero-search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadListings();
});

document.addEventListener('DOMContentLoaded', () => {
    const urlSearch = new URLSearchParams(window.location.search).get('search');
    if (urlSearch) {
        document.getElementById('hero-search').value = urlSearch;
    }
    loadListings();
});

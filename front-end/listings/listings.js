// Find My Vibe — listings page
// Fetches real properties from the Django API (/api/properties/) with
// server-side filtering, instead of the hardcoded static cards that used
// to live in listings.html. Also wires up favouriting for logged-in
// students via /api/properties/<id>/toggle_favourite/.

const API_BASE = 'http://127.0.0.1:8000/api';

const listingsGrid = document.getElementById('listings');
const resultsCount = document.getElementById('results-count');
const filtersSidebar = document.getElementById('filters-sidebar');
const toggleFiltersBtn = document.getElementById('toggle-filters');

// Fallback sample data if API fails
const FALLBACK_LISTINGS = [
    {
        id: 1,
        title: "Modern Apartment near Campus",
        rent: 4500,
        location: "Downtown District",
        distance_from_campus_km: 2,
        university_nearby: "University Of the Western Cape",
        is_available: true,
        average_rating: 4.5,
        images: [{ image: '/front-end/Images/image1.jpg', is_primary: true }]
    },
    {
        id: 2,
        title: "Cozy Studio with Utilities Included",
        rent: 3200,
        location: "Riverside Area",
        distance_from_campus_km: 1.5,
        university_nearby: "University",
        is_available: true,
        average_rating: 4.2,
        images: [{ image: '/front-end/Images/image2.jpg', is_primary: true }]
    },
    {
        id: 3,
        title: "Shared Apartment - 3 Bedrooms",
        rent: 2800,
        location: "Student Quarter",
        distance_from_campus_km: 0.8,
        university_nearby: "University Of the Western Cape",
        is_available: true,
        average_rating: 4.7,
        images: [{ image: '/front-end/Images/image3.jpg', is_primary: true }]
    },
    {
        id: 4,
        title: "Luxury Suite with Gym Access",
        rent: 5500,
        location: "Prestige Heights",
        distance_from_campus_km: 3,
        university_nearby: "University Of the Western Cape",
        is_available: true,
        average_rating: 4.8,
        images: [{ image: '/front-end/Images/kovacs_image1.jpg', is_primary: true }]
    },
    {
        id: 5,
        title: "Budget-Friendly Dorm Room",
        rent: 2200,
        location: "Campus Residences",
        distance_from_campus_km: 0.3,
        university_nearby: "University Of the Western Cape",
        is_available: false,
        average_rating: 4.0,
        images: [{ image: '/front-end/Images/image1.jpg', is_primary: true }]
    },
    {
        id: 6,
        title: "Furnished Flat with Balcony",
        rent: 3800,
        location: "Garden District",
        distance_from_campus_km: 1.2,
        university_nearby: "University Of the Western Cape",
        is_available: true,
        average_rating: 4.6,
        images: [{ image: '/front-end/Images/image2.jpg', is_primary: true }]
    },
];

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
        // Use fallback data on API error
        console.log('Using fallback sample data...');
        displayFallbackListings();
    }
}

function displayFallbackListings() {
    const filtered = filterListings(FALLBACK_LISTINGS);
    resultsCount.textContent = filtered.length;
    
    if (!filtered.length) {
        listingsGrid.innerHTML = '<p>No properties match your filters. Try adjusting your search criteria.</p>';
        return;
    }
    
    listingsGrid.innerHTML = filtered.map(propertyCardHTML).join('');
    attachFavouriteHandlers();
}

function filterListings(listings) {
    const minRent = parseInt(document.getElementById('min-rent').value) || 0;
    const maxRent = parseInt(document.getElementById('max-rent').value) || Infinity;
    
    const checkedRoomTypes = Array.from(document.querySelectorAll('.room-type-filter:checked')).map(el => el.value);
    const checkedAmenities = Array.from(document.querySelectorAll('.amenity-filter:checked')).map(el => el.value);
    const searchTerm = document.getElementById('hero-search').value.trim().toLowerCase();
    
    return listings.filter(property => {
        // Filter by rent
        if (property.rent < minRent || property.rent > maxRent) {
            return false;
        }
        
        // Filter by room type (if any are selected)
        if (checkedRoomTypes.length > 0) {
            const roomType = property.room_type || 'SINGLE';
            if (!checkedRoomTypes.includes(roomType)) {
                return false;
            }
        }
        
        // Filter by amenities (if any are selected)
        if (checkedAmenities.length > 0) {
            const propertyAmenities = property.amenities || [];
            const hasAllAmenities = checkedAmenities.some(amenity => 
                propertyAmenities.includes(amenity)
            );
            if (!hasAllAmenities && checkedAmenities.length > 0) {
                return false;
            }
        }
        
        // Filter by search term
        if (searchTerm) {
            const searchableText = `${property.title} ${property.location} ${property.university_nearby}`.toLowerCase();
            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }
        
        return true;
    });
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

// Sidebar toggle functionality
toggleFiltersBtn.addEventListener('click', () => {
    filtersSidebar.classList.toggle('collapsed');
    if (filtersSidebar.classList.contains('collapsed')) {
        toggleFiltersBtn.textContent = '☰ Show Filters';
    } else {
        toggleFiltersBtn.textContent = '✕ Hide Filters';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const urlSearch = new URLSearchParams(window.location.search).get('search');
    if (urlSearch) {
        document.getElementById('hero-search').value = urlSearch;
    }
    loadListings();
});

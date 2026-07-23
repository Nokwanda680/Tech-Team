// Find My Vibe — Saved listings (student dashboard)
// Loads the student's real favourites from /api/favourites/ instead of the
// six hardcoded grid-card blocks (Sunset Apartments, Observatory Garden, ...)
// that used to be here. Also fills in the sidebar user card from /api/accounts/me/
// instead of the hardcoded "Zara Mokoena".

const API_BASE = 'https://find-my-vibe.onrender.com/api';
const ACCOUNTS_BASE = 'https://find-my-vibe.onrender.com/api/accounts';

const gridEl = document.getElementById('saved-listing-grid');
const subtitleEl = document.getElementById('saved-subtitle');
const navBadge = document.getElementById('saved-nav-badge');

const PHOTO_COLORS = [
    ['var(--blue-dim)', 'var(--blue)'],
    ['var(--orange-dim)', 'var(--orange)'],
    ['var(--lime-dim)', 'var(--lime)'],
    ['rgba(255,255,255,0.06)', 'var(--muted)'],
];

let allFavourites = [];

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function initials(title) {
    return title.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

async function loadUserCard() {
    try {
        const response = await fetch(`${ACCOUNTS_BASE}/me/`, { credentials: 'include' });
        if (!response.ok) {
            window.location.href = '/front-end/login/Login.html';
            return;
        }
        const user = await response.json();
        const fullName = `${user.first_name} ${user.last_name}`.trim() || user.username;
        document.getElementById('user-name').textContent = fullName;
        document.getElementById('user-role-label').textContent =
            `Student${user.institution ? ' · ' + user.institution : ''}`;
        document.getElementById('user-avatar').textContent = initials(fullName) || user.username.slice(0, 2).toUpperCase();
    } catch (error) {
        console.error('Error loading current user:', error);
    }
}

function cardHTML(fav, index) {
    const property = fav.property_detail;
    const [bg, fg] = PHOTO_COLORS[index % PHOTO_COLORS.length];
    const tagClass = property.is_available ? 'tag-available' : 'tag-occupied';
    const tagLabel = property.is_available ? 'Available' : 'Unavailable';
    const amenityPreview = (property.amenities || []).slice(0, 3).map(a => a.name).join(' · ');

    return `
      <div class="grid-card" data-favourite-id="${fav.id}" data-property-id="${property.id}" style="cursor:pointer;">
        <div class="grid-card-photo" style="background:${bg}; color:${fg};">
          ${initials(property.title)}
          <div class="grid-card-save saved" data-property-id="${property.id}" title="Remove from favourites">
            <i class="ti ti-heart-filled" aria-hidden="true"></i>
          </div>
        </div>
        <div class="grid-card-body">
          <div class="grid-card-top">
            <span class="grid-card-name">${escapeHTML(property.title)}</span>
            <span class="grid-card-price">R ${Number(property.rent).toLocaleString()}<span>/mo</span></span>
          </div>
          <div class="grid-card-addr"><i class="ti ti-map-pin" style="font-size:11px" aria-hidden="true"></i> ${escapeHTML(property.location)}</div>
          <div class="grid-card-meta">
            <span class="tag ${tagClass}">${tagLabel}</span>
            <span style="font-size:11px; color:var(--muted)">${escapeHTML(amenityPreview)}</span>
          </div>
        </div>
      </div>
    `;
}

function render(favourites) {
    if (!favourites.length) {
        gridEl.innerHTML = '<p>You haven\'t saved any listings yet. <a href="/front-end/listings/listings.html">Browse listings</a> and tap the heart on ones you like.</p>';
        return;
    }
    gridEl.innerHTML = favourites.map(cardHTML).join('');

    gridEl.querySelectorAll('.grid-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.grid-card-save')) return; // handled separately
            window.location.href = `/front-end/listings/property_detail.html?id=${card.dataset.propertyId}`;
        });
    });

    gridEl.querySelectorAll('.grid-card-save').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const propertyId = btn.dataset.propertyId;
            try {
                const response = await fetch(`${API_BASE}/properties/${propertyId}/toggle_favourite/`, {
                    method: 'POST',
                    credentials: 'include',
                                    headers: csrfHeaders(),
                });
                if (!response.ok) throw new Error(`Server returned ${response.status}`);
                await loadFavourites();
            } catch (error) {
                console.error('Error removing favourite:', error);
            }
        });
    });
}

function applyFilter(filter) {
    if (filter === 'available') {
        render(allFavourites.filter(f => f.property_detail.is_available));
    } else {
        render(allFavourites);
    }
}

async function loadFavourites() {
    try {
        const response = await fetch(`${API_BASE}/favourites/`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        allFavourites = data.results !== undefined ? data.results : data;

        subtitleEl.textContent = `${allFavourites.length} listing${allFavourites.length === 1 ? '' : 's'} saved`;
        navBadge.textContent = allFavourites.length;

        const activeChip = document.querySelector('.chip.active');
        applyFilter(activeChip ? activeChip.dataset.filter : 'all');
    } catch (error) {
        console.error('Error loading favourites:', error);
        gridEl.innerHTML = '<p>Could not load your saved listings right now.</p>';
    }
}

document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyFilter(chip.dataset.filter);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    loadUserCard();
    loadFavourites();
});

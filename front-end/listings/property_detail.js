// Find My Vibe — property detail page
// Reads ?id=<property_id> from the URL, loads the real property + reviews
// from the API, and wires up the enquiry and review forms for logged-in
// students.

const API_BASE = 'http://127.0.0.1:8000/api';

const propertyId = new URLSearchParams(window.location.search).get('id');
const loadingEl = document.getElementById('detail-loading');
const contentEl = document.getElementById('detail-content');

function isLoggedInStudent() {
    return localStorage.getItem('role') === 'STUDENT';
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function loadProperty() {
    if (!propertyId) {
        loadingEl.textContent = 'No property specified.';
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/properties/${propertyId}/`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const property = await response.json();
        renderProperty(property);
        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
        setupEnquiryForm();
        loadReviews();
        setupReviewForm();
    } catch (error) {
        console.error('Error loading property:', error);
        loadingEl.textContent = 'Sorry, this property could not be loaded.';
    }
}

function renderProperty(property) {
    window.__landlordId = property.landlord;
    document.title = `${property.title} — Find My Vibe`;
    document.getElementById('detail-title').textContent = property.title;
    document.getElementById('detail-location').textContent =
        `${property.location}${property.university_nearby ? ' · near ' + property.university_nearby : ''}`;
    document.getElementById('detail-rent').textContent = `R ${Number(property.rent).toLocaleString()}`;
    document.getElementById('detail-description').textContent = property.description || 'No description provided.';
    document.getElementById('detail-rules').textContent = property.rules || 'No specific rules listed.';
    document.getElementById('detail-contact').textContent =
        [property.contact_email, property.contact_phone].filter(Boolean).join(' · ') || 'Contact details not provided.';

    const gallery = document.getElementById('detail-gallery');
    const images = (property.images && property.images.length) ? property.images : [{ image: '/Images/logo.jpg' }];
    gallery.innerHTML = images.map(img => `<img src="${img.image}" alt="${escapeHTML(property.title)}">`).join('');

    const tags = document.getElementById('detail-tags');
    const tagList = [
        property.room_type,
        property.is_available ? 'Available now' : 'Currently unavailable',
        property.distance_from_campus_km ? `${property.distance_from_campus_km}km from campus` : null,
        ...(property.amenities || []).map(a => a.name),
    ].filter(Boolean);
    tags.innerHTML = tagList.map(t => `<span class="detail-tag">${escapeHTML(t)}</span>`).join('');
}

function setupEnquiryForm() {
    const form = document.getElementById('enquiry-form');
    const notice = document.getElementById('enquiry-login-notice');
    if (!isLoggedInStudent()) {
        notice.classList.remove('hidden');
        return;
    }
    form.classList.remove('hidden');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = document.getElementById('enquiry-message').value.trim();
        const status = document.getElementById('enquiry-status');
        if (!message) return;
        try {
            const response = await fetch(`${API_BASE}/enquiries/`, {
                method: 'POST',
                headers: csrfHeaders({ 'Content-Type': 'application/json' }),
                credentials: 'include',
                body: JSON.stringify({ property: propertyId, message }),
            });
            if (!response.ok) throw new Error(`Server returned ${response.status}`);
            status.textContent = 'Enquiry sent! The landlord will be notified.';
            form.reset();
        } catch (error) {
            console.error('Error sending enquiry:', error);
            status.textContent = 'Could not send your enquiry. Please try again.';
        }
    });
}

async function loadReviews() {
    const list = document.getElementById('reviews-list');
    const avg = document.getElementById('reviews-average');
    try {
        const response = await fetch(`${API_BASE}/reviews/?property=${propertyId}`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();
        const reviews = data.results !== undefined ? data.results : data;

        if (!reviews.length) {
            list.innerHTML = '<p>No reviews yet — be the first to leave one.</p>';
            avg.textContent = '';
            return;
        }

        const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        avg.textContent = `— ★ ${average.toFixed(1)} (${reviews.length} review${reviews.length === 1 ? '' : 's'})`;

        list.innerHTML = reviews.map(r => `
          <div class="review-item">
            <span class="review-rating">★ ${r.rating}/5</span> — ${escapeHTML(r.student_username)}
            <p>${escapeHTML(r.comment)}</p>
            <div class="review-meta">${new Date(r.created_at).toLocaleDateString()}</div>
          </div>
        `).join('');
    } catch (error) {
        console.error('Error loading reviews:', error);
        list.innerHTML = '<p>Could not load reviews right now.</p>';
    }
}

function setupReviewForm() {
    const form = document.getElementById('review-form');
    const notice = document.getElementById('review-login-notice');
    if (!isLoggedInStudent()) {
        notice.classList.remove('hidden');
        return;
    }
    form.classList.remove('hidden');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rating = document.getElementById('review-rating').value;
        const comment = document.getElementById('review-comment').value.trim();
        const status = document.getElementById('review-status');
        try {
            const response = await fetch(`${API_BASE}/reviews/`, {
                method: 'POST',
                headers: csrfHeaders({ 'Content-Type': 'application/json' }),
                credentials: 'include',
                body: JSON.stringify({ property: propertyId, rating, comment }),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                if (errData.non_field_errors || response.status === 400) {
                    status.textContent = 'You may have already reviewed this property.';
                } else {
                    status.textContent = 'Could not submit your review.';
                }
                return;
            }
            status.textContent = 'Review submitted, thank you!';
            form.reset();
            loadReviews();
        } catch (error) {
            console.error('Error submitting review:', error);
            status.textContent = 'Could not submit your review.';
        }
    });
}

function isLoggedIn() {
    return !!localStorage.getItem('role');
}

function setupReportModal() {
    const overlay = document.getElementById('report-modal-overlay');
    const notice = document.getElementById('report-login-notice');
    const form = document.getElementById('report-form');
    const statusEl = document.getElementById('report-status');

    document.getElementById('open-report-btn').addEventListener('click', () => {
        overlay.classList.remove('hidden');
        if (isLoggedIn()) {
            notice.classList.add('hidden');
            form.classList.remove('hidden');
        } else {
            notice.classList.remove('hidden');
            form.classList.add('hidden');
        }
    });

    document.getElementById('report-modal-close').addEventListener('click', () => overlay.classList.add('hidden'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.add('hidden'); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const targetType = document.getElementById('report-target-type').value;
        const reason = document.getElementById('report-reason').value.trim();
        const description = document.getElementById('report-description').value.trim();
        if (!reason) return;

        const payload = { target_type: targetType, reason, description };
        if (targetType === 'PROPERTY') {
            payload.reported_property = propertyId;
        } else {
            // Reported user is filled in from the property's landlord once
            // it's loaded - see loadProperty(), which stashes it globally.
            payload.reported_user = window.__landlordId || null;
        }

        try {
            const response = await fetch(`${API_BASE}/reports/`, {
                method: 'POST',
                headers: csrfHeaders({ 'Content-Type': 'application/json' }),
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error(`Server returned ${response.status}`);
            statusEl.textContent = 'Report submitted. An admin will review it.';
            form.reset();
            setTimeout(() => overlay.classList.add('hidden'), 1200);
        } catch (error) {
            console.error('Error submitting report:', error);
            statusEl.textContent = 'Could not submit your report. Please try again.';
        }
    });
}

document.addEventListener('DOMContentLoaded', loadProperty);
document.addEventListener('DOMContentLoaded', setupReportModal);

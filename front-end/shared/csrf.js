// Find My Vibe — shared CSRF helper
//
// SECURITY PASS: this replaces the CsrfExemptSessionAuthentication hack
// (findmyvibe/authentication.py) that let every DRF endpoint skip Django's
// CSRF check. The backend's settings.py was already correctly configured
// for real cross-origin CSRF (CORS_ALLOW_HEADERS includes x-csrftoken,
// CSRF_TRUSTED_ORIGINS is set) — that infrastructure just wasn't being
// used. This file wires it up: it primes the csrftoken cookie as soon as
// the page loads (via GET /api/accounts/csrf/), and csrfHeaders() reads
// that cookie synchronously so it can be dropped straight into any
// fetch()'s `headers` option.
//
// Include this script BEFORE any page-specific JS that calls csrfHeaders().
// Usage: fetch(url, { method: 'POST', credentials: 'include',
//                      headers: csrfHeaders({'Content-Type': 'application/json'}) })

const CSRF_ENDPOINT = 'http://127.0.0.1:8000/api/accounts/csrf/';

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
}

// Merges a real X-CSRFToken header into whatever headers you already have.
// Synchronous by design so it can be used inline in a fetch() call - relies
// on primeCsrfCookie() (below) having already run when the page loaded.
function csrfHeaders(extra = {}) {
    const token = getCookie('csrftoken');
    return token ? { ...extra, 'X-CSRFToken': token } : { ...extra };
}

// Hits the backend so the browser has a csrftoken cookie before the
// user submits any form. Safe to call repeatedly. Pass true to force a
// refresh before a new POST request.
async function primeCsrfCookie(forceRefresh = false) {
    if (!forceRefresh && getCookie('csrftoken')) return;
    try {
        await fetch(CSRF_ENDPOINT, { credentials: 'include' });
    } catch (error) {
        console.error('Could not fetch CSRF cookie:', error);
    }
}

primeCsrfCookie();

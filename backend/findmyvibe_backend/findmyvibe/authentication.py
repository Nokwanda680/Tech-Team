# NOTE: this file previously defined CsrfExemptSessionAuthentication, which
# disabled Django's CSRF check entirely for every DRF endpoint using session
# auth. That was flagged as known debt, not a real fix. It's been replaced
# with real CSRF enforcement now that the frontend actually primes and sends
# the CSRF token (see /api/accounts/csrf/ and front-end/shared/csrf.js).
# Nothing else in this project needs to import from here anymore, but the
# file is kept (rather than deleted) in case something still references it -
# it now just re-exports the standard DRF class under the old name.
from rest_framework.authentication import SessionAuthentication as CsrfExemptSessionAuthentication  # noqa: F401

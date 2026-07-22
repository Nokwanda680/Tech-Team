"""
views.py — Find My Vibe root dashboard redirect

NOTE (Phase 0 fix): this view used to be a ~180-line aspirational sketch
that referenced models/relations that don't exist anywhere in this project
(`from yourapp.models import Listing, Application, SystemHealth` — "yourapp"
isn't a real app; `user.saved_listings`, `user.checklist_items`,
`profile.vibe_score`, `user.maintenance_tickets`, etc. have no matching
fields on User/Profile/StudentProfile/LandlordProfile). It also depended on
`user.profile`, which never got created reliably (see accounts/signals.py).
Calling this at /dashboard/ 500'd for every real user.

It also duplicated something that already exists: login.js already does a
client-side redirect to the right static dashboard page per role after a
successful /api/accounts/login/ call. This view is kept as a thin
server-side fallback that sends a logged-in user to the same place.

The big 624-line templates/findmyvibe/dashboard.html (vibe scores,
"applications", maintenance tickets) is a separate, more ambitious concept
than what's described in the current brief (which talks about enquiries,
reviews, reports, favourites — not applications/vibe-score/maintenance).
Left untouched for now; worth a deliberate decision later on whether to
build that feature out or archive it, rather than silently resurrecting it
here.
"""

from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect

from accounts.models import User


@login_required
def dashboard(request):
    role = request.user.role
    if role == User.Role.STUDENT:
        return redirect("/front-end/dashboards/student dashboard/student_dashboard.html")
    if role == User.Role.LANDLORD:
        return redirect("/front-end/dashboards/landlord dashboard/landlord_dashboard.html")
    if role == User.Role.ADMIN or request.user.is_superuser:
        return redirect("/front-end/dashboards/admin dashboard/admin_dashboard.html")
    return redirect("/front-end/login/Login.html")

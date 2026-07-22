from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "accounts"  # Phase 0 fix: LOGIN_URL/LOGOUT_REDIRECT_URL use the
# "accounts:login" dotted form, which needs this app_name to reverse at all.

router = DefaultRouter()
router.register("admin/users", views.UserAdminViewSet, basename="admin-users")

urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", views.login_user, name="login"),
    path("logout/", views.logout_user, name="logout"),
    path("me/", views.current_user, name="current_user"),
    path("me/update/", views.update_profile, name="update_profile"),
    path("me/change-password/", views.change_password, name="change_password"),
    path("csrf/", views.csrf_init, name="csrf_init"),
    path("", include(router.urls)),
]

# NOTE (Phase 0 fix): this file used to declare "login/" and "logout/" TWICE —
# once pointing at the JSON API views above, and once pointing at
# RoleBasedLoginView / Django's built-in LogoutView. Whichever was declared
# last silently won, so login.js's fetch() calls to /api/accounts/login/
# were not reliably hitting the view you thought they were. RoleBasedLoginView
# also crashed (see accounts/views.py) because it read `user.profile.role`,
# and Profile rows were never actually created (see accounts/signals.py fix).
# Removed the duplicate/session-template login path for now — reintroduce a
# server-rendered login route later if you want one distinct from the JSON API.

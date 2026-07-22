# Django `accounts` App — Role-Based Registration & Login

A self-contained Django app providing account creation and authentication
for three roles: **Admin**, **Landlord**, and **Student**.

## Features

- Custom `User` model (`accounts.User`) with a `role` field (`ADMIN`, `LANDLORD`, `STUDENT`)
- Separate registration flows for **Student** and **Landlord** (each creates
  a linked profile: `StudentProfile` / `LandlordProfile`)
- **Admin accounts are intentionally NOT self-registerable** — create them via
  `python manage.py createsuperuser` or promote a user in Django Admin. This
  prevents anyone from signing up as an admin through the public form.
- Login accepts **username or email** (custom auth backend)
- Role-based dashboard redirect after login (`/accounts/dashboard/`)
- Role-enforcement via a `@role_required(...)` decorator and a
  `RoleRequiredMixin` for class-based views — visiting another role's
  dashboard returns `403 Forbidden`
- Minimal templates so it works out of the box (style however you like)

## Files

```
accounts/
├── admin.py            # Django admin registration
├── apps.py
├── backends.py          # Email-or-username auth backend
├── decorators.py         # role_required() + RoleRequiredMixin
├── forms.py             # StudentRegistrationForm, LandlordRegistrationForm
├── models.py             # User, LandlordProfile, StudentProfile
├── urls.py
├── views.py
├── migrations/
└── templates/accounts/
    ├── base.html
    ├── register.html
    ├── login.html
    ├── dashboard_admin.html
    ├── dashboard_landlord.html
    └── dashboard_student.html
```

## Installation

1. Copy the `accounts/` folder into your Django project root (next to `manage.py`).

2. In `settings.py`:

```python
INSTALLED_APPS = [
    ...
    "accounts",
]

AUTH_USER_MODEL = "accounts.User"

AUTHENTICATION_BACKENDS = [
    "accounts.backends.EmailOrUsernameModelBackend",
    "django.contrib.auth.backends.ModelBackend",
]

LOGIN_URL = "accounts:login"
LOGIN_REDIRECT_URL = "accounts:dashboard"
LOGOUT_REDIRECT_URL = "accounts:login"
```

> ⚠️ `AUTH_USER_MODEL` **must** be set before your first `migrate` ever runs
> on this project. If you already have a database with the default
> `auth.User`, you'll need to start fresh (new DB) or write a data migration.

3. In your project's root `urls.py`:

```python
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("accounts/", include("accounts.urls")),
]
```

4. Run migrations:

```bash
python manage.py makemigrations accounts
python manage.py migrate
```

5. Create your first admin:

```bash
python manage.py createsuperuser
```

## URLs

| URL | Purpose |
|---|---|
| `/accounts/register/student/` | Student sign-up |
| `/accounts/register/landlord/` | Landlord sign-up |
| `/accounts/login/` | Log in (username or email) |
| `/accounts/logout/` | Log out |
| `/accounts/dashboard/` | Redirects to the correct role dashboard |
| `/accounts/dashboard/admin/` | Admin-only |
| `/accounts/dashboard/landlord/` | Landlord-only |
| `/accounts/dashboard/student/` | Student-only |

## Enforcing roles elsewhere in your project

Function-based view:

```python
from accounts.decorators import role_required
from accounts.models import User

@role_required(User.Role.LANDLORD)
def my_listings(request):
    ...
```

Class-based view:

```python
from accounts.decorators import RoleRequiredMixin
from accounts.models import User

class MyListingsView(RoleRequiredMixin, View):
    allowed_roles = [User.Role.LANDLORD]
    ...
```

Superusers always pass every role check.

## Verified working

This app was scaffolded into a fresh Django 6.0 project and exercised end-to-end:
`makemigrations` / `migrate` ran clean, student & landlord registration
create the user + profile and log the user in immediately, `/accounts/dashboard/`
correctly redirects by role, cross-role dashboard access returns 403, and
logging in with an email address (instead of username) works via the custom
backend.

## Notes / things you may want to extend

- Add email verification (send a confirmation link) before setting `is_verified=True`.
- Add password reset views (`django.contrib.auth.views.PasswordResetView`, etc.) — not included here since it needs email backend config specific to your project.
- Consider rate-limiting login attempts (e.g. `django-axes`) for production.
- The templates are intentionally minimal — restyle to match your project.

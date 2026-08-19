# Find My Vibe Student Accommodation Finder

Find My Vibe is a student accommodation platform with a Django REST API and a static HTML, CSS, and JavaScript frontend. Students can browse and save properties, contact landlords, and leave reviews. Landlords can manage properties and enquiries, while administrators can review listings, users, and reports.

## Project Structure

```text
backend/findmyvibe_backend/   Django project, apps, database, templates, and media
front-end/                    Static frontend pages, styles, scripts, and images
backend/findmyvibe_backend/db.sqlite3
							 Local SQLite database
```

The backend is the source of truth for authentication, properties, favourites, enquiries, reviews, reports, and notifications. The frontend communicates with it through the REST API.

## Requirements

- Windows, macOS, or Linux
- Python 3.12 or newer recommended
- A modern browser
- Git, if cloning the repository

The backend dependencies are listed in `requirements.txt`. The project currently uses Django 6, Django REST Framework, django-filter, django-cors-headers, Pillow, WhiteNoise, Gunicorn, and SQLite for local development.

## Run Locally

Open two terminals from the repository root. The commands below use Windows PowerShell.

### 1. Create and activate a virtual environment

```powershell
cd "backend\findmyvibe_backend"
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, activate the environment with Command Prompt instead:

```bat
.venv\Scripts\activate.bat
```

The repository may contain an existing `backend\findmyvibe_backend\env` environment, but creating a fresh `.venv` is recommended for a clean setup.

### 2. Install backend dependencies

Run this while the virtual environment is active:

```powershell
py -m pip install --upgrade pip
py -m pip install -r requirements.txt
```

### 3. Apply database migrations

```powershell
py manage.py migrate
```

The local project uses SQLite, so no separate database server is required. The existing `db.sqlite3` may already contain development data.

### 4. Create an administrator account

This is optional if the database already contains an administrator:

```powershell
py manage.py createsuperuser
```

Follow the prompts to choose the email/username and password.

### 5. Start the Django backend

```powershell
py manage.py runserver 127.0.0.1:8000
```

Keep this terminal running. The backend is available at:

- API root: http://127.0.0.1:8000/api/
- Django admin: http://127.0.0.1:8000/admin/
- Dashboard: http://127.0.0.1:8000/dashboard/

### 6. Serve the frontend

In a second terminal, return to the repository root and serve the whole repository:

```powershell
cd "c:\path\to\Find My VIbe-Student Accomodation Finder"
py -m http.server 5500
```

Open the application at:

http://127.0.0.1:5500/front-end/home%20page/index.html

Serving from the repository root is important because the frontend uses paths such as `/front-end/...`. Opening the HTML files directly with `file://` can cause broken assets, API requests, or browser security restrictions.

## Main API Endpoints

The API is rooted at `http://127.0.0.1:8000/api/`.

| Area | Endpoint |
| --- | --- |
| Accounts | `/api/accounts/register/`, `/login/`, `/logout/`, `/me/` |
| Properties | `/api/properties/` |
| Property images | `/api/property-images/` |
| Amenities | `/api/amenities/` |
| Favourites | `/api/favourites/` |
| Enquiries | `/api/enquiries/` |
| Reviews | `/api/reviews/` |
| Reports | `/api/reports/` |
| Notifications | `/api/notifications/` |
| Admin statistics | `/api/admin/stats/` |

The browsable Django REST Framework interface can be used to inspect endpoints while the development server is running.

## Testing and Maintenance

Run Django's test suite from `backend\findmyvibe_backend`:

```powershell
py manage.py test
```

Useful maintenance commands:

```powershell
py manage.py check
py manage.py makemigrations
py manage.py migrate
py manage.py collectstatic --noinput
```

Only run `makemigrations` after changing Django models and reviewing the generated migration files.

## Configuration

The backend reads these optional environment variables:

| Variable | Purpose | Local default |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | Secret used for signing cookies and tokens | Development fallback in settings |
| `DJANGO_DEBUG` | Enables debug mode when set to `True` | `True` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hostnames accepted by Django | Empty list |
| `DJANGO_EXTRA_CORS_ORIGINS` | Comma-separated additional frontend origins | None |

For a local PowerShell session, for example:

```powershell
$env:DJANGO_DEBUG = "True"
$env:DJANGO_ALLOWED_HOSTS = "127.0.0.1,localhost"
```

The default local CORS and CSRF configuration already allows the frontend on port 5500 and the backend on port 8000.

## Uploaded Files and Static Files

- User avatars and property images are stored under `backend/findmyvibe_backend/media/` during development.
- Django serves media files locally when `DEBUG=True`.
- Static assets are collected into `backend/findmyvibe_backend/staticfiles/` by `collectstatic`.
- Do not rely on Django's development media serving or the committed SQLite database for production.

## Production Notes

Before deploying:

1. Set a strong, unique `DJANGO_SECRET_KEY`.
2. Set `DJANGO_DEBUG=False`.
3. Set `DJANGO_ALLOWED_HOSTS` to the real backend hostname(s).
4. Set `DJANGO_EXTRA_CORS_ORIGINS` to the real frontend origin(s).
5. Use HTTPS and a production-ready server such as Gunicorn behind a reverse proxy.
6. Move uploaded media and rate-limit/cache state to production infrastructure.
7. Use a managed database and configure backups instead of relying on SQLite.
8. Run `py manage.py check --deploy` and review every warning.

Never commit real passwords, API keys, production secret keys, or private uploaded files.

## Troubleshooting

**The frontend shows no listings:** confirm that `py manage.py runserver 127.0.0.1:8000` is still running and that the browser is using the frontend URL on port 5500.

**CORS or CSRF errors appear:** use the HTTP frontend URL rather than opening a file directly, and ensure the frontend origin is included in `CORS_ALLOWED_ORIGINS` or `DJANGO_EXTRA_CORS_ORIGINS`.

**The database is missing tables:** run `py manage.py migrate` from `backend\findmyvibe_backend`.

**Images do not load:** check that the file exists under `backend\findmyvibe_backend\media` and that the Django server is running with `DEBUG=True`.

**Port 8000 or 5500 is already in use:** stop the process using the port or start the relevant server on another port. The frontend JavaScript currently expects the backend at `127.0.0.1:8000`, so changing the backend port requires updating the frontend API URLs as well.


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

## 3. redirect to the main backend directory
on your terminal run
```powershell
cd "C:\Users\nomfu\OneDrive\Desktop\Find My VIbe-Student Accomodation Finder\backend\findmyvibe_backend"
```
## 4. run the backend
on your terminal run
```powershell
"Find My VIbe-Student Accomodation Finder\backend\findmyvibe_backend> python manage.py runserver"
```
## 5. Run it Locally
Install Live Server extension 
Right-Click on the index.html page 
Click Sign in at the top left of the landing page of the website
on the username part write:
 ```text 
 demo_student21 or demo_landlord1
 ```
 on the password part write:
 ```text
DemoPass123!
```
# Now you can browse through the website
## HAVE FUN!!!
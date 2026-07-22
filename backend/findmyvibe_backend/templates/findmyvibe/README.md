# Find My Vibe — Django Templates

## File structure

```
findmyvibe_templates/
├── templates/
│   └── findmyvibe/
│       ├── base.html          ← Shell: fonts, CSS/JS links, block slots
│       └── dashboard.html     ← Main dashboard (extends base.html)
├── static/
│   ├── css/
│   │   └── dashboard.css      ← All styles extracted from original HTML
│   └── js/
│       └── dashboard.js       ← Role switcher, nav renderer, bar charts
├── views.py                   ← Sample view with full context documentation
└── README.md
```

## Setup

### 1. Add to INSTALLED_APPS & configure static/template dirs

```python
# settings.py
INSTALLED_APPS = [
    ...
    'findmyvibe',
]

TEMPLATES = [{
    ...
    'DIRS': [BASE_DIR / 'templates'],
}]

STATICFILES_DIRS = [BASE_DIR / 'static']
```

### 2. Copy files into your project

```
your_project/
├── templates/findmyvibe/base.html
├── templates/findmyvibe/dashboard.html
├── static/css/dashboard.css
└── static/js/dashboard.js
```

### 3. Wire up the URL

```python
# urls.py
from django.urls import path
from findmyvibe.views import dashboard

urlpatterns = [
    path('dashboard/', dashboard, name='dashboard'),
]
```

### 4. Run collectstatic

```bash
python manage.py collectstatic
```

---

## How context maps to the template

| Context key | Template usage |
|-------------|---------------|
| `current_role` | Sets the active panel and sidebar role button |
| `user_roles` | Dict of roles the user can switch between (shows switcher if >1) |
| `page_title` | Topbar heading |
| `student.*` | All student panel data |
| `landlord.*` | All landlord panel data |
| `admin.*` | All admin panel data |

### Key student sub-keys
| Key | Type | Description |
|-----|------|-------------|
| `student.stats` | list of dicts | 4 stat cards. Keys: `label`, `color`, `value`, `meta`, `trend_up` |
| `student.recommended_listings` | list of dicts | Keys: `initials`, `accent`, `name`, `address`, `status_tag`, `status_label`, `amenities`, `price` |
| `student.applications` | list of dicts | Keys: `property_name`, `submitted_date`, `status_tag`, `status_label` |
| `student.messages` | list of dicts | Keys: `initials`, `accent`, `sender`, `preview`, `time_ago`, `unread` |
| `student.checklist` | list of dicts | Keys: `label`, `done` |
| `student.checklist_pct` | int | 0–100, drives the progress bar width |
| `student.vibe_factors` | list of dicts | Keys: `label`, `value` (0–100), `color` |
| `student.vibe_score` | int | Overall score shown in the score box |

### Status tag values
Use these exact strings for `status_tag` — they map to CSS classes:

| Value | CSS class | Colour |
|-------|-----------|--------|
| `available` | `.tag-available` | Lime |
| `occupied`  | `.tag-occupied`  | Blue |
| `pending`   | `.tag-pending`   | Orange |
| `rejected`  | `.tag-rejected`  | Red |

### Accent colour values
Use these for `accent` fields — they resolve to CSS vars:

`blue` · `orange` · `lime` · `muted`

---

## Extending pages

To create a dedicated page (e.g. `/listings/`) that reuses the shell:

```html
{% extends "findmyvibe/base.html" %}
{% block title %}Find Housing{% endblock %}

{% block body %}
<div class="app role-student" id="app">
  {% include "findmyvibe/_sidebar.html" %}
  <main class="main">
    {% include "findmyvibe/_topbar.html" %}
    <div class="content">
      {# your page content here #}
    </div>
  </main>
</div>
{% endblock %}
```

> Tip: extract `_sidebar.html` and `_topbar.html` as partials using
> `{% include %}` once you have more than one page.

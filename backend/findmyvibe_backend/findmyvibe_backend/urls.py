"""
URL configuration for findmyvibe_backend project.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from findmyvibe_backend.views import dashboard

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/", include("findmyvibe.urls")),
    path('dashboard/', dashboard, name='dashboard'),
]

# Phase 0 fix: no MEDIA_URL/MEDIA_ROOT were configured at all, so uploaded
# property images / profile pictures had nowhere to be served from in
# development. This only applies while DEBUG=True — a real deployment should
# serve media via nginx/whitenoise/S3, not Django itself.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

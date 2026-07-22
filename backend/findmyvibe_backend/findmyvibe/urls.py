from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("properties", views.PropertyViewSet, basename="property")
router.register("property-images", views.PropertyImageViewSet, basename="property-image")
router.register("amenities", views.AmenityViewSet, basename="amenity")
router.register("favourites", views.FavouriteViewSet, basename="favourite")
router.register("enquiries", views.EnquiryViewSet, basename="enquiry")
router.register("reviews", views.ReviewViewSet, basename="review")
router.register("reports", views.ReportViewSet, basename="report")
router.register("notifications", views.NotificationViewSet, basename="notification")

urlpatterns = [
    path("", views.index, name="index"),
    path("admin/stats/", views.PlatformStatsView.as_view(), name="platform-stats"),
    path("", include(router.urls)),
]

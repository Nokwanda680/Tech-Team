from django.utils import timezone
from django_filters import rest_framework as df_filters
from rest_framework import permissions, status, views, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Amenity, Enquiry, Favourite, Notification, Property, PropertyImage, Report, Review
from .permissions import IsAdminRole, IsLandlord, IsOwnerLandlordOrReadOnly, IsStudent
from .serializers import (
    AmenitySerializer,
    EnquirySerializer,
    FavouriteSerializer,
    NotificationSerializer,
    PropertyImageSerializer,
    PropertySerializer,
    ReportSerializer,
    ReviewSerializer,
)


def index(request):
    from django.http import JsonResponse

    return JsonResponse({"message": "Find My Vibe API root. See /api/ for endpoints."})


class PropertyFilter(df_filters.FilterSet):
    """Real Django-ORM filtering — matches the brief's 'do not fake filtering
    using only JavaScript' requirement."""

    min_rent = df_filters.NumberFilter(field_name="rent", lookup_expr="gte")
    max_rent = df_filters.NumberFilter(field_name="rent", lookup_expr="lte")
    location = df_filters.CharFilter(field_name="location", lookup_expr="icontains")
    university_nearby = df_filters.CharFilter(field_name="university_nearby", lookup_expr="icontains")
    amenities = df_filters.CharFilter(method="filter_amenities")
    landlord = df_filters.NumberFilter(field_name="landlord_id")

    class Meta:
        model = Property
        fields = ["room_type", "is_available", "location", "university_nearby", "landlord", "is_flagged", "status"]

    def filter_amenities(self, queryset, name, value):
        names = [v.strip() for v in value.split(",") if v.strip()]
        for amenity_name in names:
            queryset = queryset.filter(amenities__name__iexact=amenity_name)
        return queryset.distinct()


class PropertyViewSet(viewsets.ModelViewSet):
    """
    Public read access (list/retrieve) for anyone, including anonymous
    visitors browsing listings. Create/update/delete restricted to the
    listing's own landlord (or an admin) via IsOwnerLandlordOrReadOnly.
    """

    serializer_class = PropertySerializer
    permission_classes = [IsOwnerLandlordOrReadOnly]
    filterset_class = PropertyFilter
    search_fields = ["title", "location", "university_nearby", "description"]
    ordering_fields = ["rent", "created_at", "distance_from_campus_km"]

    def get_queryset(self):
        qs = Property.objects.select_related("landlord").prefetch_related("images", "amenities")
        user = self.request.user
        if user.is_authenticated and (user.is_admin_role or user.is_superuser):
            return qs  # admins see everything, including pending/rejected
        if user.is_authenticated and user.is_landlord:
            # landlords see their own listings regardless of status, plus
            # everyone else's approved+available ones
            return qs.filter(
                models_Q_approved_or_own(user)
            )
        return qs.filter(status=Property.Status.APPROVED, is_available=True)

    @action(detail=True, methods=["post"], permission_classes=[IsStudent])
    def toggle_favourite(self, request, pk=None):
        property_obj = self.get_object()
        fav, created = Favourite.objects.get_or_create(student=request.user, property=property_obj)
        if not created:
            fav.delete()
            return Response({"favourited": False})
        return Response({"favourited": True})


def models_Q_approved_or_own(user):
    from django.db.models import Q

    return Q(status=Property.Status.APPROVED, is_available=True) | Q(landlord=user)


class PropertyImageViewSet(viewsets.ModelViewSet):
    serializer_class = PropertyImageSerializer
    permission_classes = [IsLandlord]

    def get_queryset(self):
        return PropertyImage.objects.filter(property__landlord=self.request.user)

    def perform_create(self, serializer):
        property_obj = serializer.validated_data.get("property")
        if property_obj and property_obj.landlord_id != self.request.user.id and not self.request.user.is_superuser:
            raise PermissionDenied("You can only add images to your own listings.")
        serializer.save()


class AmenityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
    permission_classes = [permissions.AllowAny]


class FavouriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavouriteSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        return Favourite.objects.filter(student=self.request.user).select_related("property")


class EnquiryViewSet(viewsets.ModelViewSet):
    serializer_class = EnquirySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin_role or user.is_superuser:
            return Enquiry.objects.all()
        if user.is_landlord:
            return Enquiry.objects.filter(property__landlord=user)
        return Enquiry.objects.filter(student=user)

    @action(detail=True, methods=["post"], permission_classes=[IsLandlord])
    def reply(self, request, pk=None):
        enquiry = self.get_object()
        if enquiry.property.landlord_id != request.user.id and not request.user.is_superuser:
            return Response({"detail": "Not your listing."}, status=status.HTTP_403_FORBIDDEN)
        reply_text = request.data.get("reply", "").strip()
        if not reply_text:
            return Response({"detail": "reply is required."}, status=status.HTTP_400_BAD_REQUEST)
        enquiry.landlord_reply = reply_text
        enquiry.status = Enquiry.Status.REPLIED
        enquiry.replied_at = timezone.now()
        enquiry.save()
        Notification.objects.create(
            user=enquiry.student,
            message=f"Landlord replied to your enquiry on {enquiry.property.title}",
            link=f"/properties/{enquiry.property_id}/",
        )
        return Response(EnquirySerializer(enquiry).data)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsStudent()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = Review.objects.select_related("student", "property")
        property_id = self.request.query_params.get("property")
        if property_id:
            qs = qs.filter(property_id=property_id)
        if self.request.query_params.get("mine") == "true" and self.request.user.is_authenticated:
            qs = qs.filter(student=self.request.user)
        return qs


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    def perform_create(self, serializer):
        # status is writable on the serializer so admins can PATCH it later,
        # but a reporter should never be able to set their own report's
        # status at creation time.
        serializer.save(reporter=self.request.user, status=Report.Status.OPEN)

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (user.is_admin_role or user.is_superuser):
            return Report.objects.all()
        return Report.objects.none()


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({"detail": "All notifications marked read."})


class PlatformStatsView(views.APIView):
    """Admin-only platform-wide counts, used by the admin dashboard/analytics
    pages instead of hardcoded numbers."""

    permission_classes = [IsAdminRole]

    def get(self, request):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        return Response({
            "total_students": User.objects.filter(role=User.Role.STUDENT).count(),
            "total_landlords": User.objects.filter(role=User.Role.LANDLORD).count(),
            "total_admins": User.objects.filter(role=User.Role.ADMIN).count(),
            "active_users": User.objects.filter(is_active=True).count(),
            "suspended_users": User.objects.filter(is_active=False).count(),
            "total_properties": Property.objects.count(),
            "pending_properties": Property.objects.filter(status=Property.Status.PENDING).count(),
            "approved_properties": Property.objects.filter(status=Property.Status.APPROVED).count(),
            "flagged_properties": Property.objects.filter(is_flagged=True).count(),
            "total_enquiries": Enquiry.objects.count(),
            "open_enquiries": Enquiry.objects.filter(status=Enquiry.Status.OPEN).count(),
            "total_reviews": Review.objects.count(),
            "total_reports": Report.objects.count(),
            "open_reports": Report.objects.filter(status=Report.Status.OPEN).count(),
            "total_favourites": Favourite.objects.count(),
        })

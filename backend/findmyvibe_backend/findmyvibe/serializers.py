from rest_framework import serializers

from .models import (
    Amenity,
    Enquiry,
    Favourite,
    Notification,
    Property,
    PropertyImage,
    Report,
    Review,
)


class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ["id", "name"]


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ["id", "image", "caption", "is_primary", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class PropertySerializer(serializers.ModelSerializer):
    landlord_username = serializers.ReadOnlyField(source="landlord.username")
    images = PropertyImageSerializer(many=True, read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)
    amenity_ids = serializers.PrimaryKeyRelatedField(
        source="amenities", queryset=Amenity.objects.all(), many=True, write_only=True, required=False
    )
    average_rating = serializers.ReadOnlyField()
    favourites_count = serializers.IntegerField(source="favourited_by.count", read_only=True)

    class Meta:
        model = Property
        fields = [
            "id", "landlord", "landlord_username", "title", "description", "rent",
            "location", "university_nearby", "distance_from_campus_km", "room_type",
            "amenities", "amenity_ids", "rules", "contact_email", "contact_phone",
            "is_available", "status", "is_flagged", "created_at", "updated_at",
            "images", "average_rating", "favourites_count",
        ]
        read_only_fields = ["id", "landlord", "created_at", "updated_at"]

    def update(self, instance, validated_data):
        # status/is_flagged are moderation fields - only an admin should be
        # able to change them, even though the owning landlord can PATCH
        # everything else on their own listing. Silently drop them rather
        # than erroring, so a landlord's normal "save changes" doesn't fail
        # just because the form also happened to submit these fields.
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not (user and (user.is_staff or getattr(user, "is_admin_role", False) or user.is_superuser)):
            validated_data.pop("status", None)
            validated_data.pop("is_flagged", None)
        return super().update(instance, validated_data)

    def create(self, validated_data):
        validated_data["landlord"] = self.context["request"].user
        # New listings always start pending moderation regardless of what
        # was submitted - see the same reasoning in update() above.
        validated_data.pop("status", None)
        validated_data.pop("is_flagged", None)
        return super().create(validated_data)


class FavouriteSerializer(serializers.ModelSerializer):
    property_detail = PropertySerializer(source="property", read_only=True)

    class Meta:
        model = Favourite
        fields = ["id", "property", "property_detail", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        validated_data["student"] = self.context["request"].user
        return super().create(validated_data)


class EnquirySerializer(serializers.ModelSerializer):
    student_username = serializers.ReadOnlyField(source="student.username")
    property_title = serializers.ReadOnlyField(source="property.title")
    landlord_username = serializers.ReadOnlyField(source="property.landlord.username")

    class Meta:
        model = Enquiry
        fields = [
            "id", "student", "student_username", "property", "property_title", "landlord_username",
            "message", "landlord_reply", "status", "created_at", "replied_at",
        ]
        read_only_fields = ["id", "student", "landlord_reply", "status", "created_at", "replied_at"]

    def create(self, validated_data):
        validated_data["student"] = self.context["request"].user
        return super().create(validated_data)


class ReviewSerializer(serializers.ModelSerializer):
    student_username = serializers.ReadOnlyField(source="student.username")

    class Meta:
        model = Review
        fields = ["id", "student", "student_username", "property", "rating", "comment", "created_at"]
        read_only_fields = ["id", "student", "created_at"]

    def create(self, validated_data):
        validated_data["student"] = self.context["request"].user
        return super().create(validated_data)


class ReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.ReadOnlyField(source="reporter.username")

    class Meta:
        model = Report
        fields = [
            "id", "reporter", "reporter_username", "target_type", "reported_property",
            "reported_user", "reason", "description", "status", "created_at",
        ]
        read_only_fields = ["id", "reporter", "created_at"]

    def create(self, validated_data):
        validated_data["reporter"] = self.context["request"].user
        return super().create(validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "message", "link", "is_read", "created_at"]
        read_only_fields = ["id", "message", "link", "created_at"]

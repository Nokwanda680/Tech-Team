from rest_framework import serializers

from .models import User


class UserAdminSerializer(serializers.ModelSerializer):
    """Admin-facing view of a user account, for the admin Users page."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "full_name", "first_name", "last_name", "email",
            "phone_number", "role", "is_active", "date_joined", "avatar",
        ]
        read_only_fields = ["id", "username", "role", "date_joined"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

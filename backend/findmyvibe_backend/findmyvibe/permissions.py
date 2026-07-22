from rest_framework import permissions


class IsLandlord(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and
                     (request.user.is_landlord or request.user.is_superuser))


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and
                     (request.user.is_student or request.user.is_superuser))


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and
                     (request.user.is_admin_role or request.user.is_superuser))


class IsOwnerLandlordOrReadOnly(permissions.BasePermission):
    """Anyone can read (list/retrieve); only the listing's own landlord
    (or an admin) can create/update/delete it."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and
                     (request.user.is_landlord or request.user.is_admin_role or request.user.is_superuser))

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.landlord_id == request.user.id or request.user.is_admin_role or request.user.is_superuser

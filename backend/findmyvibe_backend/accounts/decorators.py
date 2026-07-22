from functools import wraps

from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions import PermissionDenied


def role_required(*roles):
    """
    Function-view decorator restricting access to specific roles.
    Superusers always pass.

        @role_required(User.Role.LANDLORD)
        def my_view(request): ...
    """

    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def _wrapped(request, *args, **kwargs):
            if request.user.is_superuser or request.user.role in roles:
                return view_func(request, *args, **kwargs)
            raise PermissionDenied("You do not have access to this page.")

        return _wrapped

    return decorator


class RoleRequiredMixin(LoginRequiredMixin):
    """
    Class-based-view mixin restricting access to specific roles.

        class MyView(RoleRequiredMixin, View):
            allowed_roles = [User.Role.ADMIN]
    """

    allowed_roles = []

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return super().dispatch(request, *args, **kwargs)
        if request.user.is_superuser or request.user.role in self.allowed_roles:
            return super().dispatch(request, *args, **kwargs)
        raise PermissionDenied("You do not have access to this page.")

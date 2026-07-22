from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Profile

# NOTE (Phase 0 fix): this used to import django.contrib.auth.models.User —
# the *default* Django user model — instead of the project's custom
# AUTH_USER_MODEL ('accounts.User'). Because of that this signal never
# fired for real users, so `Profile` rows were never created, which is
# why anything reading `user.profile` (e.g. RoleBasedLoginView) crashed.


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_or_update_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance, defaults={"role": instance.role.lower()})
    elif hasattr(instance, "profile"):
        instance.profile.role = instance.role.lower()
        instance.profile.save()

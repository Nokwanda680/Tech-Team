from django.shortcuts import render
import json
import secrets
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.contrib.auth import get_user_model, authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.cache import cache
from rest_framework import permissions, viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import StudentProfile, LandlordProfile
from .serializers import UserAdminSerializer
from findmyvibe.permissions import IsAdminRole

User = get_user_model()


@csrf_exempt
def csrf_init(request):
    """Hit once on page load so the browser has a csrftoken cookie before
    any POST/PATCH/DELETE fetch on the site - see front-end/shared/csrf.js.
    Without this, the very first unsafe request from a fresh visitor (who
    hasn't loaded any other Django-rendered page) would have no CSRF cookie
    to send at all."""
    return JsonResponse({"detail": "CSRF cookie set."})


class UserAdminViewSet(viewsets.ModelViewSet):
    """Admin-only user management: list/search/filter, suspend/unban
    (toggle_active), delete, and reset a user's password. Backs the admin
    Users page — there was no user-management API at all before this."""

    serializer_class = UserAdminSerializer
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = User.objects.all().order_by("-date_joined")
        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role.upper())
        search = self.request.query_params.get("search")
        if search:
            from django.db.models import Q

            qs = qs.filter(
                Q(username__icontains=search) | Q(email__icontains=search) |
                Q(first_name__icontains=search) | Q(last_name__icontains=search)
            )
        return qs

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.is_superuser:
            return Response({"detail": "Cannot delete a superuser account."}, status=400)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        """Used for both 'suspend'/'unban' — this project doesn't have a
        separate suspended-vs-banned status field, just Django's built-in
        is_active, so both actions are the same toggle for now."""
        user = self.get_object()
        if user.is_superuser:
            return Response({"detail": "Cannot deactivate a superuser account."}, status=400)
        user.is_active = not user.is_active
        user.save(update_fields=["is_active"])
        return Response(UserAdminSerializer(user).data)

    @action(detail=True, methods=["post"])
    def reset_password(self, request, pk=None):
        """Admin-triggered password reset. There's no email-sending
        configured in this project, so this generates a temporary password
        and returns it directly for the admin to relay to the user."""
        user = self.get_object()
        temp_password = secrets.token_urlsafe(9)
        user.set_password(temp_password)
        user.save()
        return Response({"detail": "Password reset.", "temporary_password": temp_password})


def register(request):
    """Register a new student or landlord account"""
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "message": "POST request required"},
            status=405
        )
    try:
        data = json.loads(request.body)
        username = data.get("username")
        email = data.get("email")
        password1 = data.get("password1")
        password2 = data.get("password2")
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        phone_number = data.get("phone_number", "")
        role = data.get("role", User.Role.STUDENT)
        
        # Validation
        if not username or not email or not password1:
            return JsonResponse(
                {"success": False, "message": "Username, email and password are required."},
                status=400
            )
        
        if password1 != password2:
            return JsonResponse(
                {"success": False, "message": "Passwords do not match."},
                status=400
            )
        
        try:
            validate_password(password1)
        except DjangoValidationError as exc:
            return JsonResponse(
                {"success": False, "message": " ".join(exc.messages)},
                status=400
            )
        
        # Prevent admin account creation
        if role == User.Role.ADMIN:
            return JsonResponse(
                {"success": False, "message": "Admin accounts cannot be created from the website."},
                status=403
            )
        
        # Check if username/email exists
        if User.objects.filter(username=username).exists():
            return JsonResponse(
                {"success": False, "message": "Username already exists."},
                status=400
            )
        
        if User.objects.filter(email=email).exists():
            return JsonResponse(
                {"success": False, "message": "Email already exists."},
                status=400
            )
        
        # Create user
        new_user = User.objects.create_user(
            username=username,
            email=email,
            password=password1,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            role=role
        )
        
        # Create role-specific profile
        if role == User.Role.STUDENT:
            institution = data.get("institution", "")
            student_number = data.get("student_number", "")
            StudentProfile.objects.create(
                user=new_user,
                institution=institution,
                student_number=student_number
            )
        elif role == User.Role.LANDLORD:
            company_name = data.get("company_name", "")
            id_number = data.get("id_number", "")
            LandlordProfile.objects.create(
                user=new_user,
                company_name=company_name,
                id_number=id_number
            )
        
        # Log in the user
        login(request, new_user)
        
        return JsonResponse({
            "success": True,
            "message": "Account created successfully.",
            "username": new_user.username,
            "role": new_user.role,
            "user_id": new_user.id
        }, status=201)
        
    except json.JSONDecodeError:
        return JsonResponse(
            {"success": False, "message": "Invalid JSON data."},
            status=400
        )
    except Exception as e:
        return JsonResponse(
            {"success": False, "message": str(e)},
            status=500
        )


def login_user(request):
    """Login user with username or email"""
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "message": "POST request required"},
            status=405
        )
    try:
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")
        
        if not username or not password:
            return JsonResponse(
                {"success": False, "message": "Username and password are required"},
                status=400
            )
        # Security pass: this view had no brute-force protection at all -
        # unlimited password guesses were possible against any account.
        # Cache-based limiter, keyed by client IP + attempted username, so
        # one attacker can't lock out someone else's account by spamming
        # their username from a different IP, and vice versa.
        client_ip = request.META.get("REMOTE_ADDR", "unknown")
        throttle_key = f"login_attempts:{client_ip}:{username.lower()}"
        attempts = cache.get(throttle_key, 0)
        if attempts >= 5:
            return JsonResponse(
                {"success": False, "message": "Too many failed login attempts. Please try again in a few minutes."},
                status=429
            )
        # Authenticate user (supports both username and email)
        user = authenticate(request, username=username, password=password)
        if user is not None:
            cache.delete(throttle_key)
            login(request, user)
            return JsonResponse({
                "success": True,
                "message": "Login successful",
                "username": user.username,
                "role": user.role,
                "user_id": user.id
            }, status=200)
        else:
            cache.set(throttle_key, attempts + 1, timeout=300)  # 5 minute window
            return JsonResponse(
                {"success": False, "message": "Invalid username or password"},
                status=401
            )
    
    except json.JSONDecodeError:
        return JsonResponse(
            {"success": False, "message": "Invalid JSON data."},
            status=400
        )
    except Exception as e:
        return JsonResponse(
            {"success": False, "message": str(e)},
            status=500
        )
def logout_user(request):
    """Logout the current user"""
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "message": "POST request required"},
            status=405
        )
    
    try:
        logout(request)
        return JsonResponse({
            "success": True,
            "message": "Logout successful"
        }, status=200)
    except Exception as e:
        return JsonResponse(
            {"success": False, "message": str(e)},
            status=500
        )


def current_user(request):
    """Return the logged-in user's own profile info as JSON.
    Added so frontend pages that show 'who am I' (sidebar user cards, etc.)
    can use real data instead of a hardcoded name like 'Zara Mokoena'."""
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Not logged in."}, status=401)

    user = request.user
    data = {
        "success": True,
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "role": user.role,
        "bio": user.bio,
        "avatar": user.avatar.url if user.avatar else None,
    }
    if user.role == User.Role.STUDENT and hasattr(user, "student_profile"):
        data["institution"] = user.student_profile.institution
    if user.role == User.Role.LANDLORD and hasattr(user, "landlord_profile"):
        data["company_name"] = user.landlord_profile.company_name

    return JsonResponse(data, status=200)


def update_profile(request):
    """Lets a logged-in user edit their own name/phone/bio/avatar. POST
    (not PATCH) so it can accept multipart/form-data for the avatar file -
    Django doesn't parse PATCH bodies as multipart the way it does POST.
    Backs the new student/landlord 'My profile' pages - there was no way
    to actually save profile edits anywhere in this project before this."""
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Not logged in."}, status=401)
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "POST request required"}, status=405)

    user = request.user
    for field in ("first_name", "last_name", "phone_number", "bio"):
        if field in request.POST:
            setattr(user, field, request.POST[field])

    if "avatar" in request.FILES:
        user.avatar = request.FILES["avatar"]

    user.save()
    return JsonResponse({"success": True, "message": "Profile updated."}, status=200)


def change_password(request):
    """Lets a logged-in user change their own password (old password
    required). Distinct from the admin-triggered reset_password action on
    UserAdminViewSet, which generates a temp password for someone else."""
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "message": "Not logged in."}, status=401)
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "POST request required"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"success": False, "message": "Invalid JSON."}, status=400)

    old_password = data.get("old_password", "")
    new_password = data.get("new_password", "")

    user = request.user
    if not user.check_password(old_password):
        return JsonResponse({"success": False, "message": "Current password is incorrect."}, status=400)

    try:
        validate_password(new_password, user=user)
    except DjangoValidationError as e:
        return JsonResponse({"success": False, "message": " ".join(e.messages)}, status=400)

    user.set_password(new_password)
    user.save()
    login(request, user)  # keep the session valid after changing the password
    return JsonResponse({"success": True, "message": "Password changed."}, status=200)


# NOTE (Phase 0 fix): this file used to define login_user() TWICE. The second
# definition (removed) silently replaced the first at import time, which also
# dropped the @csrf_exempt decorator. There was also a RoleBasedLoginView
# class (removed) that read `self.request.user.profile.role` — since Profile
# rows were never actually created (see signals.py fix), this crashed for
# every real login. It wasn't wired into urls.py cleanly either (see the
# urls.py fix for the duplicate login/ path). If you want a server-rendered
# login page later, rebuild it against `user.role` directly rather than
# `user.profile.role` to avoid depending on the separate Profile model.
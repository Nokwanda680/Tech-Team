from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.core.exceptions import ValidationError

from .models import User, LandlordProfile, StudentProfile


class BaseRegistrationForm(UserCreationForm):
    """Shared fields/validation for every self-service registration form."""

    email = forms.EmailField(required=True)
    first_name = forms.CharField(required=True, max_length=150)
    last_name = forms.CharField(required=True, max_length=150)
    phone_number = forms.CharField(required=False, max_length=20)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "password1",
            "password2",
        ]

    def clean_email(self):
        email = self.cleaned_data["email"].lower()
        if User.objects.filter(email__iexact=email).exists():
            raise ValidationError("A user with that email already exists.")
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        user.phone_number = self.cleaned_data.get("phone_number", "")
        if commit:
            user.save()
        return user


class StudentRegistrationForm(BaseRegistrationForm):
    institution = forms.CharField(required=False, max_length=255)
    student_number = forms.CharField(required=False, max_length=50)

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = User.Role.STUDENT
        if commit:
            user.save()
            StudentProfile.objects.create(
                user=user,
                institution=self.cleaned_data.get("institution", ""),
                student_number=self.cleaned_data.get("student_number", ""),
            )
        return user


class LandlordRegistrationForm(BaseRegistrationForm):
    company_name = forms.CharField(required=False, max_length=255)
    id_number = forms.CharField(required=False, max_length=50)

    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = User.Role.LANDLORD
        if commit:
            user.save()
            LandlordProfile.objects.create(
                user=user,
                company_name=self.cleaned_data.get("company_name", ""),
                id_number=self.cleaned_data.get("id_number", ""),
            )
        return user


class AccountAuthenticationForm(AuthenticationForm):
    """Login form — label reflects that username OR email both work."""

    username = forms.CharField(label="Username or email")

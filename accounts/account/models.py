from django.contrib.auth.models import AbstractUser
from django.db import models
 
 
class User(AbstractUser):
    """
    Custom user model with a `role` field.
    Roles: ADMIN, LANDLORD, STUDENT.
 
    NOTE: Anyone can self-register as LANDLORD or STUDENT.
    ADMIN accounts should only be created via `createsuperuser`
    or promoted manually in Django admin — never exposed on a
    public registration form.
    """
 
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        LANDLORD = "LANDLORD", "Landlord"
        STUDENT = "STUDENT", "Student"
 
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.STUDENT,
    )
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether this account has verified their email/identity.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
 
    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN or self.is_superuser
 
    @property
    def is_landlord(self):
        return self.role == self.Role.LANDLORD
 
    @property
    def is_student(self):
        return self.role == self.Role.STUDENT
 
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
 
 
class LandlordProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="landlord_profile"
    )
    company_name = models.CharField(max_length=255, blank=True)
    id_number = models.CharField(max_length=50, blank=True)
    verified = models.BooleanField(
        default=False, help_text="Verified by an admin as a legitimate landlord."
    )
 
    def __str__(self):
        return f"Landlord profile: {self.user.username}"
 
 
class StudentProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="student_profile"
    )
    institution = models.CharField(max_length=255, blank=True)
    student_number = models.CharField(max_length=50, blank=True)
 
    def __str__(self):
        return f"Student profile: {self.user.username}"
 

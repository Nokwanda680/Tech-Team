from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

'''
class Students(models.Model):
    fname = models.CharField(max_length=100)
    lname = models.CharField(max_length=100)
    std_number = models.CharField(max_length=10)
    alternate_phone_number = models.IntegerField(default=0)
    phone_number =models.CharField(max_length=10)
    D_O_B = models.DateField()
    gender = models.CharField(max_length=6)
    home_address=models.TextField(max_length=255)
    #Emergency contact
    e_fname = models.CharField(max_length=100)
    e_lname = models.CharField(max_length=100)
    e_relationship = models.CharField(max_length=100)
    e_d_o_b = models.DateField(max_length=100)
    e_gender = models.CharField(max_length=6)
    e_email = models.EmailField(max_length=255)
    e_phone_no = models.IntegerField()
    #academics
    uni = models.CharField(max_length=255)
    faculty = models.CharField(max_length=255)
    Course = models.CharField(max_length=255)
    E_Y_O_G = models.IntegerField()
    sponsor = models.CharField(max_length=100)
    #medical and safety
    allergy = models.CharField(max_length=500,default=None)
    med_cond = models.CharField(max_length=500)
    Disabilities = models.BooleanField(default=False)
    med_aid = models.BooleanField(default=False)
    Medial_Aid_Provider=models.CharField(max_length=500)
    medical_aid_number = models.CharField(max_length=100)

    def __str__(self)->str:
        return f"{self.fname}"
        
class User(AbstractUser):
    Role_Choices = (('student','Student'),('landlord','Landlord'),('admin','Admin'))
    role = models.CharField(max_length=20,choices=Role_Choices, default = 'student')
    is_superuser =models.BooleanField(default=False)
    
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='student_groups',
        blank=True,
        help_text='The groups this user belongs to.'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='student_user_permissions',
        blank=True,
        help_text='Specific permissions for this user.'
    )

'''

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
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    bio = models.TextField(blank=True)
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
        return f"Student profile : {self.user.username}"


class Profile(models.Model):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("landlord", "Landlord"),
        ("student", "Student"),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.user.username} ({self.role})"
 

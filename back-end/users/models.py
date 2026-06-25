from django.contrib.auth.models import AbstractUser
from django.db import models

#commented lines are lines that are optiona;l and should have their own table in the database because they can create crashes when doing migrations and make the database have issues as they can have null values

class User(AbstractUser):
    Role_choices = (
        ('student','Student'),
        ('landlord','Landlord'),
        ('admin','Admin')
        )
    role = models.CharField(max_length=20,choices=Role_choices, default = 'student')
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now=True)
    updated_at = models.DateField(auto_now=True)
    fname = models.CharField(max_length=50)
    lname = models.CharField(max_length=50)
    gender = models.CharField(max_length = 6)

    def __str__(self):
        return self.username
    
if User.role == 'student':
    pass
if User.role == 'landlord':
    pass
#Student Profile
class StudentProfile(models.Model):
    
    student_number = models.CharField(max_length=10)
    user = models.OneToOneField(User,on_delete=models.CASCADE)
    university = models.CharField(max_length=100)
    year_of_study = models.IntegerField()
    #budget = models.DecimalField(max_digits=8 , decimal_places= 2)
    #preffered_location = models.CharField(max_length=20,default='belhar')
    
   # date_of_birth = models.DateField()
   # city = models.CharField()
   # home_address = models.CharField(max_length=100)
    #alternate_phone_number = models.CharField()

    def __str__(self):
        return self.user.username

class LandlordProfile(models.Model):
    user=models.OneToOneField(User,on_delete=models.CASCADE )
    company_name =models.CharField(max_length= 255 ,blank=True)
    #verified = models.BooleanField(default=False)
    number_of_properties = models.IntegerField(default=0) 
    def __str__(self):
        return self.user.username

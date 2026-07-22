from django.contrib import admin
from .models import User,LandlordProfile,StudentProfile,Profile

admin.site.register(User)
admin.site.register(LandlordProfile)
admin.site.register(StudentProfile)
admin.site.register(Profile)
# Register your models here.

from django.contrib import admin
from users.models import User ,StudentProfile,LandlordProfile

admin.site.register(StudentProfile)
admin.site.register(LandlordProfile)
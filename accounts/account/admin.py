from django.contrib import admin

# Register your models here.

from django.contrib.auth.admin import UserAdmin
 
from .models import User, LandlordProfile, StudentProfile
 
 
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ("username", "email", "role", "is_verified", "is_staff", "is_active")
    list_filter = ("role", "is_verified", "is_staff", "is_active")
    search_fields = ("username", "email", "first_name", "last_name")
    fieldsets = UserAdmin.fieldsets + (
        ("Role info", {"fields": ("role", "phone_number", "is_verified")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Role info", {"fields": ("email", "role", "phone_number")}),
    )
 
 
class LandlordProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "company_name", "verified")
    list_filter = ("verified",)
 
 
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "institution", "student_number")
 
 
admin.site.register(User, CustomUserAdmin)
admin.site.register(LandlordProfile, LandlordProfileAdmin)
admin.site.register(StudentProfile, StudentProfileAdmin)


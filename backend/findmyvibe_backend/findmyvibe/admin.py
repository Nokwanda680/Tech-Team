from django.contrib import admin

from .models import Amenity, Enquiry, Favourite, Notification, Property, PropertyImage, Report, Review


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ("title", "landlord", "rent", "location", "room_type", "status", "is_available", "is_flagged")
    list_filter = ("status", "room_type", "is_available", "is_flagged")
    search_fields = ("title", "location", "university_nearby", "landlord__username")
    inlines = [PropertyImageInline]
    filter_horizontal = ("amenities",)


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    search_fields = ("name",)


@admin.register(Favourite)
class FavouriteAdmin(admin.ModelAdmin):
    list_display = ("student", "property", "created_at")


@admin.register(Enquiry)
class EnquiryAdmin(admin.ModelAdmin):
    list_display = ("student", "property", "status", "created_at")
    list_filter = ("status",)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("student", "property", "rating", "created_at")
    list_filter = ("rating",)


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("reporter", "target_type", "reported_property", "reported_user", "status", "created_at")
    list_filter = ("target_type", "status")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "message", "is_read", "created_at")
    list_filter = ("is_read",)

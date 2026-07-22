from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Amenity(models.Model):
    """A single taggable amenity (WiFi, Parking, ...). Kept as a proper
    model + M2M (rather than a comma-separated CharField on Property) so
    'filter by amenities' can use real Django queries instead of string
    matching."""

    name = models.CharField(max_length=80, unique=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "amenities"

    def __str__(self):
        return self.name


class Property(models.Model):
    class RoomType(models.TextChoices):
        SINGLE = "SINGLE", "Single room"
        SHARED = "SHARED", "Shared room"
        STUDIO = "STUDIO", "Studio apartment"
        FLAT = "FLAT", "Flat / apartment"
        HOUSE = "HOUSE", "House"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending approval"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    landlord = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="properties",
        limit_choices_to={"role": "LANDLORD"},
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    rent = models.DecimalField(max_digits=10, decimal_places=2)
    location = models.CharField(max_length=255, help_text="Suburb / area / address")
    university_nearby = models.CharField(max_length=255, blank=True)
    distance_from_campus_km = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    room_type = models.CharField(max_length=10, choices=RoomType.choices, default=RoomType.SINGLE)
    amenities = models.ManyToManyField(Amenity, blank=True, related_name="properties")
    rules = models.TextField(blank=True)

    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)

    is_available = models.BooleanField(default=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    is_flagged = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "properties"

    def __str__(self):
        return self.title

    @property
    def average_rating(self):
        return self.reviews.aggregate(models.Avg("rating"))["rating__avg"]


class PropertyImage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="property_images/")
    caption = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_primary", "uploaded_at"]

    def __str__(self):
        return f"Image for {self.property.title}"


class Favourite(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favourites"
    )
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="favourited_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "property")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student.username} ♥ {self.property.title}"


class Enquiry(models.Model):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        REPLIED = "REPLIED", "Replied"
        CLOSED = "CLOSED", "Closed"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enquiries"
    )
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="enquiries")
    message = models.TextField()
    landlord_reply = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    replied_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "enquiries"

    def __str__(self):
        return f"Enquiry from {self.student.username} on {self.property.title}"


class Review(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews"
    )
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "property")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.rating}★ by {self.student.username} on {self.property.title}"


class Report(models.Model):
    class TargetType(models.TextChoices):
        PROPERTY = "PROPERTY", "Property listing"
        USER = "USER", "User / landlord"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        REVIEWED = "REVIEWED", "Reviewed"
        DISMISSED = "DISMISSED", "Dismissed"

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports_filed"
    )
    target_type = models.CharField(max_length=10, choices=TargetType.choices)
    reported_property = models.ForeignKey(
        Property, on_delete=models.CASCADE, null=True, blank=True, related_name="reports"
    )
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="reports_received",
    )
    reason = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report by {self.reporter.username} ({self.get_target_type_display()})"


class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    message = models.CharField(max_length=255)
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:40]}"

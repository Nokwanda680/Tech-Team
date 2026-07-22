"""Shared upload validators. Nothing in this project validated file size or
type before this - a user could upload a 200MB file or a .exe renamed to
.jpg as a "property image" or avatar."""

from django.core.exceptions import ValidationError

MAX_IMAGE_SIZE_MB = 5
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def validate_image_file(file):
    if file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise ValidationError(f"Image must be smaller than {MAX_IMAGE_SIZE_MB}MB.")
    content_type = getattr(file, "content_type", None)
    if content_type and content_type not in ALLOWED_IMAGE_TYPES:
        raise ValidationError("Unsupported image type. Use JPEG, PNG, WEBP, or GIF.")

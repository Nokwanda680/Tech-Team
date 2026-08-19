from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from findmyvibe.management.commands.seed_demo_data import Command
from findmyvibe.models import Property

User = get_user_model()


class PropertyImageAssignmentTests(TestCase):
    def test_assign_property_images_distributes_accommodation_photos(self):
        landlord = User.objects.create_user(
            username='landlord_test',
            email='landlord@example.com',
            password='Pass12345',
            role=User.Role.LANDLORD,
        )
        property_obj = Property.objects.create(
            landlord=landlord,
            title='Room near campus',
            description='Nice room',
            rent=2500,
            location='Rondebosch',
            university_nearby='UCT',
            room_type=Property.RoomType.SINGLE,
        )

        created_count = Command()._assign_property_images([property_obj])

        self.assertGreater(created_count, 0)
        self.assertTrue(property_obj.images.exists())
        self.assertTrue(property_obj.images.filter(is_primary=True).exists())

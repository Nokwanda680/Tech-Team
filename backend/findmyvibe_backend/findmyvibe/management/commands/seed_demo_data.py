"""
Seed the database with realistic demo data:
    3 admins, 23 students, 7 landlords, and a spread of properties/images/

Usage:
    python manage.py seed_demo_data
    python manage.py seed_demo_data --wipe   # delete existing demo rows first
"""

import random
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import LandlordProfile, StudentProfile
from findmyvibe.models import Amenity, Enquiry, Favourite, Property, PropertyImage, Review

User = get_user_model()

FIRST_NAMES = [
    "Thabo", "Aisha", "Liam", "Zanele", "Sipho", "Naledi", "Ryan", "Lerato",
    "Kagiso", "Emma", "Tumi", "Priya", "Sarah", "Mpho", "Jordan", "Bongani",
    "Ayesha", "Kyle", "Palesa", "David", "Zola", "Nomvula", "Michael", "Amara",
    "Karabo", "Chloe", "Sibusiso", "Fatima", "Josh", "Refilwe",
]
LAST_NAMES = [
    "Nkosi", "van der Merwe", "Khumalo", "Botha", "Dlamini", "Smith",
    "Mahlangu", "Naidoo", "Pretorius", "Mokoena", "Fisher", "Zulu",
    "Adams", "Sithole", "Govender", "Steyn", "Modise", "Abrahams",
]
UNIVERSITIES = [
    "University of Cape Town", "Stellenbosch University", "University of Pretoria",
    "University of the Witwatersrand", "Rhodes University", "Nelson Mandela University",
]
SUBURBS = [
    "Rondebosch", "Observatory", "Hatfield", "Braamfontein", "Grahamstown Central",
    "Summerstrand", "Mowbray", "Stellenbosch Central", "Sunnyside", "Melville",
]
ROOM_TYPES = [c[0] for c in Property.RoomType.choices]
AMENITY_NAMES = ["WiFi", "Parking", "Laundry", "Security", "Gym", "Study Room", "Backup Power", "Furnished"]
ACCOMMODATION_IMAGES = [
    "image1.jpg",
    "image2.jpg",
    "image3.jpg",
    "img1.jpeg",
    "img2.jpeg",
    "img3.jpeg",
    "kern1.jpeg",
    "kern2.jpeg",
    "kern3.jpeg",
    "kovacs_image1.jpg",
    "kovacs_image2.jpg",
    "kovacs_image3.jpg",
]


class Command(BaseCommand):
    help = "Seed demo admins, students, landlords, properties and activity."

    def add_arguments(self, parser):
        parser.add_argument("--wipe", action="store_true", help="Delete existing demo data first.")

    @transaction.atomic
    def handle(self, *args, **options):
        if options["wipe"]:
            self.stdout.write("Wiping existing demo data...")
            Review.objects.all().delete()
            Enquiry.objects.all().delete()
            Favourite.objects.all().delete()
            Property.objects.all().delete()
            User.objects.filter(username__startswith="demo_").delete()

        amenities = [Amenity.objects.get_or_create(name=n)[0] for n in AMENITY_NAMES]

        admins = self._make_admins()
        landlords = self._make_landlords()
        students = self._make_students()
        properties = self._make_properties(landlords, amenities)
        created_images = self._assign_property_images(properties)
        self._make_activity(students, properties)

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(admins)} admins, {len(landlords)} landlords, "
            f"{len(students)} students, {len(properties)} properties, "
            f"and {created_images} accommodation photos."
        ))

    def _make_admins(self):
        admins = []
        for i in range(1, 4):
            username = f"demo_admin{i}"
            user, created = User.objects.get_or_create(
                username=username,
                defaults=dict(
                    email=f"{username}@findmyvibe.test",
                    first_name=random.choice(FIRST_NAMES),
                    last_name=random.choice(LAST_NAMES),
                    phone_number=self._phone(),
                    role=User.Role.ADMIN,
                    is_staff=True,
                    is_superuser=True,
                    bio="Find My Vibe platform administrator.",
                ),
            )
            if created:
                user.set_password("DemoPass123!")
                user.save()
            admins.append(user)
        return admins

    def _make_landlords(self):
        landlords = []
        for i in range(1, 8):
            username = f"demo_landlord{i}"
            user, created = User.objects.get_or_create(
                username=username,
                defaults=dict(
                    email=f"{username}@findmyvibe.test",
                    first_name=random.choice(FIRST_NAMES),
                    last_name=random.choice(LAST_NAMES),
                    phone_number=self._phone(),
                    role=User.Role.LANDLORD,
                    bio="Managing student accommodation for over 5 years.",
                ),
            )
            if created:
                user.set_password("DemoPass123!")
                user.save()
                LandlordProfile.objects.get_or_create(
                    user=user,
                    defaults=dict(
                        company_name=f"{user.last_name} Properties",
                        id_number=f"{random.randint(7000000000000, 9999999999999)}",
                        verified=random.choice([True, True, False]),
                    ),
                )
            landlords.append(user)
        return landlords

    def _make_students(self):
        students = []
        for i in range(1, 24):
            username = f"demo_student{i}"
            user, created = User.objects.get_or_create(
                username=username,
                defaults=dict(
                    email=f"{username}@findmyvibe.test",
                    first_name=random.choice(FIRST_NAMES),
                    last_name=random.choice(LAST_NAMES),
                    phone_number=self._phone(),
                    role=User.Role.STUDENT,
                    bio="Looking for accommodation close to campus.",
                ),
            )
            if created:
                user.set_password("DemoPass123!")
                user.save()
                StudentProfile.objects.get_or_create(
                    user=user,
                    defaults=dict(
                        institution=random.choice(UNIVERSITIES),
                        student_number=f"STU{random.randint(100000, 999999)}",
                    ),
                )
            students.append(user)
        return students

    def _make_properties(self, landlords, amenities):
        titles = [
            "Sunny Single Room near Campus", "Modern Studio Apartment", "Shared House with Garden",
            "Cozy Room in Student House", "Secure Flat Close to Shops", "Bright Room with Study Desk",
            "Affordable Shared Accommodation", "Furnished Studio with WiFi", "Quiet Room for Postgrads",
            "Spacious Room in Renovated House", "Budget-Friendly Single Room", "Upmarket Apartment near Campus",
            "Student House with Backup Power", "Room in Gated Complex", "Self-Catering Studio",
            "Room Close to Public Transport", "Newly Built Student Flat", "Homely Room with Garden Access",
            "Convenient Room near Library", "Spacious Shared House Room", "Ensuite Room with Parking",
            "Modern Room in Renovated Villa", "Loft-style Room in City Centre", "Vintage House Room with Kitchen",
            "Bright Ensuite Room with Balcony",
        ]
        properties = []
        for i, title in enumerate(titles):
            landlord = landlords[i % len(landlords)]
            university = random.choice(UNIVERSITIES)
            prop, created = Property.objects.get_or_create(
                title=title,
                landlord=landlord,
                defaults=dict(
                    description=(
                        f"{title} available for students attending {university}. "
                        "Close to shops, transport links and campus facilities."
                    ),
                    rent=random.choice([2800, 3200, 3800, 4200, 4800, 5500, 6200, 7000, 8400]),
                    location=random.choice(SUBURBS),
                    university_nearby=university,
                    distance_from_campus_km=round(random.uniform(0.2, 6.5), 1),
                    room_type=random.choice(ROOM_TYPES),
                    rules="No smoking indoors. Quiet hours from 22:00. No pets without landlord approval.",
                    contact_email=landlord.email,
                    contact_phone=landlord.phone_number,
                    is_available=random.choice([True, True, True, False]),
                    status=Property.Status.APPROVED,
                ),
            )
            if created:
                prop.amenities.set(random.sample(amenities, k=random.randint(2, 5)))
            properties.append(prop)
        return properties

    def _assign_property_images(self, properties):
        if not properties:
            return 0

        project_root = Path(__file__).resolve().parents[5]
        image_dir = project_root / "front-end" / "Images"
        created_count = 0

        for i, prop in enumerate(properties):
            if prop.images.exists():
                continue

            for offset in range(3):
                file_name = ACCOMMODATION_IMAGES[(i + offset) % len(ACCOMMODATION_IMAGES)]
                image_path = image_dir / file_name
                if not image_path.exists():
                    continue

                image_bytes = image_path.read_bytes()
                caption = f"{prop.title} accommodation photo {offset + 1}"
                PropertyImage.objects.create(
                    property=prop,
                    image=ContentFile(image_bytes, name=file_name),
                    caption=caption,
                    is_primary=(offset == 0),
                )
                created_count += 1

            if not prop.images.exists():
                fallback = image_dir / "image1.jpg"
                if fallback.exists():
                    PropertyImage.objects.create(
                        property=prop,
                        image=ContentFile(fallback.read_bytes(), name="image1.jpg"),
                        caption=f"{prop.title} accommodation photo",
                        is_primary=True,
                    )
                    created_count += 1

        return created_count

    def _make_activity(self, students, properties):
        for student in students:
            for prop in random.sample(properties, k=random.randint(1, 4)):
                Favourite.objects.get_or_create(student=student, property=prop)
            if random.random() < 0.6:
                prop = random.choice(properties)
                Enquiry.objects.get_or_create(
                    student=student,
                    property=prop,
                    defaults=dict(message=f"Hi, is '{prop.title}' still available? I'm interested in viewing it."),
                )
            if random.random() < 0.4:
                prop = random.choice(properties)
                Review.objects.get_or_create(
                    student=student,
                    property=prop,
                    defaults=dict(
                        rating=random.randint(3, 5),
                        comment="Great place, responsive landlord and close to campus.",
                    ),
                )

    @staticmethod
    def _phone():
        return f"0{random.randint(600000000, 899999999)}"

from django.db import models
from users.models import User

class Amenity(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name
    

class Listing(models.Model):
    landlord = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description= models.TextField()
    rent = models.DecimalField(max_digits=10,decimal_places=2)
    address=models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    available = models.BooleanField(default = False)
    ammenities = models.ManyToManyField(Amenity)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title


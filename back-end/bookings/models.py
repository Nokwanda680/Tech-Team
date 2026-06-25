from django.db import models
from users.models import User
from listings.models import Listing


class Bookings(models.Model):
    Status_Choices =(('pending','Pending'),('approved','Approved'),('rejected','Rejected'),('cancelled','Cancelled'))
    student = models.ForeignKey(User,on_delete=models.CASCADE)
    listing = models.CharField(Listing,max_length=100)
    status = models.CharField(max_length=20,choices = Status_Choices,default = 'pending')
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.student.username}-{self.listing.title}"


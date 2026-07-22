from django.urls import path
 
from . import views
 
app_name = "accounts"
 
urlpatterns = [
    # Registration (admin accounts are NOT self-serviceable — see models.py)
    path("register/student/", views.StudentRegisterView.as_view(), name="register_student"),
    path("register/landlord/", views.LandlordRegisterView.as_view(), name="register_landlord"),
    # Auth
    path("login/", views.AccountLoginView.as_view(), name="login"),
    path("logout/", views.logout_view, name="logout"),
    # Dashboards
    path("dashboard/", views.dashboard_redirect, name="dashboard"),
    path("dashboard/admin/", views.admin_dashboard, name="admin_dashboard"),
    path("dashboard/landlord/", views.landlord_dashboard, name="landlord_dashboard"),
    path("dashboard/student/", views.student_dashboard, name="student_dashboard"),
]



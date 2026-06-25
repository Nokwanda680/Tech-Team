from django.contrib.auth import authenticate
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User, StudentProfile, LandlordProfile
from .serializers import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        role = user.role
        phone_number = request.data.get('phone_number', '')

        if role == 'student':
            StudentProfile.objects.create(
                user=user,
                student_number=request.data.get('student_number', ''),
                university=request.data.get('university', ''),
                campus=request.data.get('campus', ''),
                year_of_study=request.data.get('year_of_study', 1),
                budget=request.data.get('budget', 0),
                preffered_location=request.data.get('preffered_location', 'belhar'),
                phone_number=phone_number,
            )
        elif role == 'landlord':
            LandlordProfile.objects.create(
                user=user,
                phone_number=phone_number,
                company_name=request.data.get('company_name', ''),
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {'message': 'User created successfully', 'token': token.key},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {'token': token.key, 'user': UserSerializer(user).data},
            status=status.HTTP_200_OK,
        )

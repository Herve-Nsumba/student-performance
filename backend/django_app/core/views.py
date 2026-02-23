from django.conf import settings
from rest_framework import serializers as drf_serializers
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import User, StudentProfile
from .permissions import IsAdmin
from .serializers import MeSerializer


DEFAULT_PASSWORD = "1234"


# ─── Auth token endpoints ────────────────────────────────────────

class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ -- returns access + refresh tokens."""
    pass


class RefreshView(TokenRefreshView):
    """POST /api/auth/refresh/ -- returns new access token."""
    pass


class MeView(APIView):
    """GET /api/auth/me/ -- returns authenticated user info + role."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = MeSerializer(request.user)
        return Response(serializer.data)


# ─── Teacher registration (admin-only) ──────────────────────────

class RegisterTeacherSerializer(drf_serializers.Serializer):
    username = drf_serializers.CharField(max_length=150)
    full_name = drf_serializers.CharField(max_length=150, required=False, default="")
    email = drf_serializers.EmailField(required=False, default="")


class RegisterTeacherView(APIView):
    """
    POST /api/auth/register-teacher/
    Admin creates a teacher account. Default password = 1234 (DEBUG only).
    """
    permission_classes = [IsAdmin]

    def post(self, request):
        ser = RegisterTeacherSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        username = ser.validated_data["username"]
        full_name = ser.validated_data.get("full_name", "")
        email = ser.validated_data.get("email", "") or f"{username}@school.local"

        if User.objects.filter(username=username).exists():
            return Response(
                {"detail": f"Username '{username}' already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        first_name = ""
        last_name = ""
        if full_name:
            parts = full_name.split(" ", 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ""

        user = User.objects.create(
            username=username,
            role=User.Role.TEACHER,
            email=email,
            first_name=first_name,
            last_name=last_name,
        )

        if settings.DEBUG:
            user.set_password(DEFAULT_PASSWORD)
        else:
            user.set_unusable_password()
        user.save()

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "default_password": DEFAULT_PASSWORD if settings.DEBUG else None,
            },
            status=status.HTTP_201_CREATED,
        )


# ─── Login options (public, for the login-page dropdowns) ───────

class LoginOptionsTeachersView(APIView):
    """
    GET /api/auth/login-options/teachers/
    Returns list of teacher objects {username, course} for the login dropdown.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        teachers = (
            User.objects.filter(role=User.Role.TEACHER)
            .order_by("username")
        )
        result = []
        for t in teachers:
            course = t.courses.first()
            result.append({
                "username": t.username,
                "course": course.name if course else "",
            })
        return Response(result)


class LoginOptionsStudentsView(APIView):
    """
    GET /api/auth/login-options/students/
    Returns list of student_codes for the login dropdown.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        profiles = (
            StudentProfile.objects.select_related("student", "user")
            .order_by("student__student_code")
        )
        result = [
            {
                "username": p.user.username,
                "student_code": p.student.student_code,
                "full_name": p.student.full_name,
            }
            for p in profiles
        ]
        return Response(result)

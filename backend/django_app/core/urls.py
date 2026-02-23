from django.urls import path
from .views import (
    LoginView,
    RefreshView,
    MeView,
    RegisterTeacherView,
    LoginOptionsTeachersView,
    LoginOptionsStudentsView,
)

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("register-teacher/", RegisterTeacherView.as_view(), name="auth-register-teacher"),
    path("login-options/teachers/", LoginOptionsTeachersView.as_view(), name="auth-options-teachers"),
    path("login-options/students/", LoginOptionsStudentsView.as_view(), name="auth-options-students"),
]

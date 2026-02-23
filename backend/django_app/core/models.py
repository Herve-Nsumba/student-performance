from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with role-based access control."""

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        TEACHER = "TEACHER", "Teacher"
        STUDENT = "STUDENT", "Student"

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.ADMIN,
    )
    email = models.EmailField(unique=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Course(models.Model):
    """A course taught by a teacher, containing students."""

    name = models.CharField(max_length=150)
    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="courses",
        limit_choices_to={"role": User.Role.TEACHER},
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class StudentProfile(models.Model):
    """
    Bridges the auth User (role=STUDENT) with the existing Student record
    and assigns them to a Course.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="student_profile",
        limit_choices_to={"role": User.Role.STUDENT},
    )
    student = models.OneToOneField(
        "students.Student",
        on_delete=models.CASCADE,
        related_name="profile",
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student_profiles",
    )

    def __str__(self):
        return f"{self.user.username} -> {self.student.student_code}"

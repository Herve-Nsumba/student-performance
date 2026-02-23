from rest_framework import serializers
from .models import User, Course, StudentProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role"]
        read_only_fields = ["id"]


class MeSerializer(serializers.ModelSerializer):
    """Returns user info plus student_id and course details if applicable."""

    student_id = serializers.SerializerMethodField()
    course_id = serializers.SerializerMethodField()
    course_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "student_id",
            "course_id",
            "course_name",
        ]

    def get_student_id(self, obj):
        if obj.role == User.Role.STUDENT and hasattr(obj, "student_profile"):
            return obj.student_profile.student_id
        return None

    def get_course_id(self, obj):
        if obj.role == User.Role.STUDENT and hasattr(obj, "student_profile"):
            return obj.student_profile.course_id
        return None

    def get_course_name(self, obj):
        if obj.role == User.Role.STUDENT and hasattr(obj, "student_profile"):
            profile = obj.student_profile
            return profile.course.name if profile.course else None
        return None


class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.username", read_only=True)

    class Meta:
        model = Course
        fields = ["id", "name", "teacher", "teacher_name", "created_at"]
        read_only_fields = ["id", "created_at"]

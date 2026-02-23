from rest_framework import serializers
from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            "id",
            "student_code",
            "full_name",
            "class_name",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

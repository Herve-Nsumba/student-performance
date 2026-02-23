from rest_framework import serializers
from .models import StudentRecord


class StudentRecordSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(write_only=True)
    student = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = StudentRecord
        fields = [
            "id",
            "student",
            "student_id",
            "previous_scores",
            "attendance",
            "hours_studied",
            "tutoring_sessions",
            "recorded_at",
        ]
        read_only_fields = ["id", "student", "recorded_at"]

    def create(self, validated_data):
        student_id = validated_data.pop("student_id")
        return StudentRecord.objects.create(
            student_id=student_id,
            **validated_data
        )

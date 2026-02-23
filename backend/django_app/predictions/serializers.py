from rest_framework import serializers
from .models import PredictionResult


class PredictionResultSerializer(serializers.ModelSerializer):
    student = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = PredictionResult
        fields = [
            "id",
            "student",
            "predicted_value",
            "risk_level",
            "created_at",
        ]
        read_only_fields = ["id", "student", "created_at"]

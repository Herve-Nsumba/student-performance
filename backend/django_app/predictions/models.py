from django.db import models
from students.models import Student
from records.models import StudentRecord


class PredictionResult(models.Model):
    RISK_LOW = "low"
    RISK_MEDIUM = "medium"
    RISK_HIGH = "high"

    RISK_CHOICES = [
        (RISK_LOW, "Low"),
        (RISK_MEDIUM, "Medium"),
        (RISK_HIGH, "High"),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="predictions")
    record = models.ForeignKey(StudentRecord, on_delete=models.SET_NULL, null=True, blank=True)

    predicted_value = models.FloatField()
    risk_level = models.CharField(max_length=10, choices=RISK_CHOICES)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.student.student_code} -> {self.predicted_value} ({self.risk_level})"

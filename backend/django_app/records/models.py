from django.db import models
from students.models import Student


class StudentRecord(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="records")

    # ML features (keep aligned with the model expectations)
    previous_scores = models.FloatField()
    attendance = models.FloatField()
    hours_studied = models.FloatField()
    tutoring_sessions = models.IntegerField()

    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-recorded_at"]

    def __str__(self) -> str:
        return f"Record for {self.student.student_code} at {self.recorded_at}"


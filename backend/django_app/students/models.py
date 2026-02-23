
from django.db import models


class Student(models.Model):
    student_code = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=150)
    class_name = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.student_code} - {self.full_name}"

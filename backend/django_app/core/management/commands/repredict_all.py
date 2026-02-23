"""
Re-run predictions for every student using their latest StudentRecord.

Loads the trained model directly (no ML service required) and creates
a fresh PredictionResult for each student.

Usage:
    python manage.py repredict_all            # add new predictions
    python manage.py repredict_all --purge    # delete old predictions first
"""

import os
from pathlib import Path

import joblib
import numpy as np
from django.core.management.base import BaseCommand

from predictions.models import PredictionResult
from records.models import StudentRecord
from students.models import Student


def compute_risk_level(predicted_value: float) -> str:
    if predicted_value >= 75:
        return PredictionResult.RISK_LOW
    if predicted_value >= 50:
        return PredictionResult.RISK_MEDIUM
    return PredictionResult.RISK_HIGH


class Command(BaseCommand):
    help = "Re-run predictions for all students using the latest model."

    def add_arguments(self, parser):
        parser.add_argument(
            "--purge",
            action="store_true",
            help="Delete ALL existing predictions before re-predicting.",
        )

    def handle(self, *args, **options):
        # Locate model
        model_path = (
            Path(__file__).resolve().parents[5]  # project root
            / "models"
            / "student_performance_rf.pkl"
        )
        if not model_path.exists():
            self.stderr.write(self.style.ERROR(f"Model not found at {model_path}"))
            return

        self.stdout.write(f"Loading model from {model_path} ...")
        model = joblib.load(model_path)

        if options["purge"]:
            count = PredictionResult.objects.count()
            PredictionResult.objects.all().delete()
            self.stdout.write(self.style.WARNING(
                f"Purged {count} old prediction(s)."
            ))

        students = Student.objects.all()
        created = 0
        skipped = 0

        for student in students:
            record = (
                StudentRecord.objects.filter(student=student)
                .order_by("-recorded_at")
                .first()
            )
            if not record:
                skipped += 1
                continue

            features = np.array([[
                float(record.previous_scores),
                float(record.attendance),
                float(record.hours_studied),
                int(record.tutoring_sessions),
            ]])

            predicted_value = float(model.predict(features)[0])
            risk_level = compute_risk_level(predicted_value)

            PredictionResult.objects.create(
                student=student,
                record=record,
                predicted_value=round(predicted_value, 2),
                risk_level=risk_level,
            )
            self.stdout.write(
                f"  {student.student_code:15s}  "
                f"predicted={predicted_value:5.1f}  risk={risk_level}"
            )
            created += 1

        self.stdout.write(self.style.SUCCESS(
            f"\nDone. {created} prediction(s) created, {skipped} skipped (no records)."
        ))

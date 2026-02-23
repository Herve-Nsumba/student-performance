import logging
import os

import requests
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Student
from .serializers import StudentSerializer
from records.models import StudentRecord
from predictions.models import PredictionResult
from core.mixins import RoleFilteredQuerysetMixin
from core.permissions import IsAdminOrTeacher

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# History-aware feature aggregation
# ---------------------------------------------------------------------------

HISTORY_WINDOW = 5  # number of recent records to consider


def build_student_features(student_id: int, n: int = HISTORY_WINDOW) -> dict | None:
    """
    Aggregate the last *n* records for a student into the 4 features the ML
    model expects.  Returns ``None`` when no records exist.

    Aggregation rules
    -----------------
    We use an **exponentially-weighted average** where the newest record has
    the most influence.  For *k* records sorted newest-first, the weight of
    record *i* (0 = newest) is::

        w_i = decay ^ i          (decay = 0.7 by default)

    Then each feature value is ``sum(w_i * x_i) / sum(w_i)``.

    Why exponential weighting?
    --------------------------
    * A plain average treats a score from weeks ago the same as today's score,
      which hides recent improvement or decline.
    * Using *only* the latest record (old behaviour) is too noisy — one bad
      day dominates.
    * Exponential weighting is a middle ground: the newest record counts most,
      but the trend from the recent past still stabilises the estimate.

    Tutoring_Sessions uses the **same weighted average** (not a sum) because
    the model was trained on a per-observation value, not a cumulative total.
    """
    records = list(
        StudentRecord.objects.filter(student_id=student_id)
        .order_by("-recorded_at")[:n]
    )

    if not records:
        return None

    decay = 0.7
    weights = [decay ** i for i in range(len(records))]
    w_sum = sum(weights)

    def wavg(field: str) -> float:
        return sum(w * float(getattr(r, field)) for w, r in zip(weights, records)) / w_sum

    features = {
        "Previous_Scores": round(wavg("previous_scores"), 4),
        "Attendance": round(wavg("attendance"), 4),
        "Hours_Studied": round(wavg("hours_studied"), 4),
        "Tutoring_Sessions": int(round(wavg("tutoring_sessions"))),
    }

    logger.info(
        "build_student_features(student=%s, n=%d, used=%d): %s",
        student_id,
        n,
        len(records),
        features,
    )
    return features


# ---------------------------------------------------------------------------
# Risk classification
# ---------------------------------------------------------------------------

def compute_risk_level(predicted_value: float) -> str:
    if predicted_value >= 75:
        return PredictionResult.RISK_LOW
    if predicted_value >= 50:
        return PredictionResult.RISK_MEDIUM
    return PredictionResult.RISK_HIGH


# ---------------------------------------------------------------------------
# ViewSet
# ---------------------------------------------------------------------------

class StudentViewSet(RoleFilteredQuerysetMixin, viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    role_filter_student_field = ""  # This IS the Student model

    def get_queryset(self):
        qs = Student.objects.all().order_by("-created_at")
        return self.get_role_filtered_queryset(qs)

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminOrTeacher()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"], url_path="predict")
    def predict(self, request, pk=None):
        # Use filtered queryset so role isolation applies
        student = self.get_queryset().filter(pk=pk).first()
        if not student:
            return Response(
                {"detail": "Student not found or access denied."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # -- Build history-aware features --
        features = build_student_features(student.id)
        if features is None:
            return Response(
                {"detail": "No StudentRecord found for this student."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Keep a reference to the newest record for the PredictionResult FK
        latest_record = (
            StudentRecord.objects.filter(student=student)
            .order_by("-recorded_at")
            .first()
        )

        ml_url = os.getenv("ML_SERVICE_URL", "http://127.0.0.1:8001").rstrip("/")

        try:
            r = requests.post(f"{ml_url}/predict", json=features, timeout=10)
            r.raise_for_status()
            data = r.json()
        except requests.RequestException as e:
            return Response(
                {"detail": "ML service request failed.", "error": str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        predicted_value = float(data["predicted_value"])
        risk_level = compute_risk_level(predicted_value)

        saved = PredictionResult.objects.create(
            student=student,
            record=latest_record,
            predicted_value=predicted_value,
            risk_level=risk_level,
        )

        return Response(
            {
                "student_id": student.id,
                "record_id": latest_record.id if latest_record else None,
                "predicted_value": saved.predicted_value,
                "risk_level": saved.risk_level,
                "created_at": saved.created_at,
                "features_used": features,
            },
            status=status.HTTP_201_CREATED,
        )

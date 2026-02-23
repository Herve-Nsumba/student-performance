from django.db.models import Avg, Count, Max, Subquery, OuterRef
from django.db.models.functions import TruncWeek
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import User, StudentProfile, Course
from core.permissions import IsAdmin, IsTeacher, IsStudent
from predictions.models import PredictionResult
from students.models import Student


def _latest_prediction_ids(student_ids=None):
    """Return IDs of the latest prediction per student."""
    qs = PredictionResult.objects.all()
    if student_ids is not None:
        qs = qs.filter(student_id__in=student_ids)
    return (
        qs.values("student_id")
        .annotate(latest_id=Max("id"))
        .values_list("latest_id", flat=True)
    )


# ─── ADMIN ANALYTICS ────────────────────────────────────────────


class AdminAverageTrendView(APIView):
    """
    GET /api/analytics/admin/average-trend/
    System-wide average predicted_value grouped by week.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        data = (
            PredictionResult.objects
            .annotate(week=TruncWeek("created_at"))
            .values("week")
            .annotate(avg_value=Avg("predicted_value"), count=Count("id"))
            .order_by("week")
        )
        result = [
            {
                "period": row["week"].isoformat(),
                "avg_value": round(row["avg_value"], 2),
                "count": row["count"],
            }
            for row in data
        ]
        return Response(result)


class AdminStudentTrendsView(APIView):
    """
    GET /api/analytics/admin/student-trends/
    Every prediction for every student, ordered chronologically.
    Returns a flat list -- the frontend builds one line per student.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        preds = (
            PredictionResult.objects
            .select_related("student")
            .order_by("created_at")
        )
        result = [
            {
                "student_code": p.student.student_code,
                "student_name": p.student.full_name,
                "predicted_value": round(p.predicted_value, 2),
                "risk_level": p.risk_level,
                "created_at": p.created_at.isoformat(),
            }
            for p in preds
        ]
        return Response(result)


class AdminRiskDistributionView(APIView):
    """
    GET /api/analytics/admin/risk-distribution/
    Count of latest prediction per student, grouped by risk_level.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        latest_ids = _latest_prediction_ids()
        counts = (
            PredictionResult.objects
            .filter(id__in=latest_ids)
            .values("risk_level")
            .annotate(count=Count("id"))
        )
        result = {row["risk_level"]: row["count"] for row in counts}
        return Response({
            "low": result.get("low", 0),
            "medium": result.get("medium", 0),
            "high": result.get("high", 0),
        })


class AdminClassComparisonView(APIView):
    """
    GET /api/analytics/admin/class-comparison/
    Average predicted_value per course (based on latest prediction per student).
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        result = []

        for course in Course.objects.all():
            student_ids = list(
                StudentProfile.objects
                .filter(course=course)
                .values_list("student_id", flat=True)
            )
            latest_ids = _latest_prediction_ids(student_ids)
            avg = PredictionResult.objects.filter(
                id__in=latest_ids
            ).aggregate(avg_val=Avg("predicted_value"))

            result.append({
                "course_id": course.id,
                "course_name": course.name,
                "avg_predicted_value": round(avg["avg_val"] or 0, 2),
                "student_count": len(student_ids),
            })

        # Include students not linked to any course (legacy class_name)
        unlinked_ids = (
            Student.objects
            .exclude(id__in=StudentProfile.objects.values_list("student_id", flat=True))
            .values_list("id", flat=True)
        )
        if unlinked_ids:
            class_names = (
                Student.objects
                .filter(id__in=unlinked_ids)
                .exclude(class_name="")
                .values_list("class_name", flat=True)
                .distinct()
            )
            for cn in class_names:
                sids = list(
                    Student.objects
                    .filter(class_name=cn, id__in=unlinked_ids)
                    .values_list("id", flat=True)
                )
                latest_ids = _latest_prediction_ids(sids)
                avg = PredictionResult.objects.filter(
                    id__in=latest_ids
                ).aggregate(avg_val=Avg("predicted_value"))
                result.append({
                    "course_id": None,
                    "course_name": f"{cn} (legacy)",
                    "avg_predicted_value": round(avg["avg_val"] or 0, 2),
                    "student_count": len(sids),
                })

        return Response(result)


# ─── TEACHER ANALYTICS ──────────────────────────────────────────


class TeacherClassTrendView(APIView):
    """
    GET /api/analytics/teacher/class-trend/
    Per-student prediction trends for students in the teacher's courses.
    """
    permission_classes = [IsTeacher]

    def get(self, request):
        student_ids = list(
            StudentProfile.objects
            .filter(course__teacher=request.user)
            .values_list("student_id", flat=True)
        )
        data = (
            PredictionResult.objects
            .filter(student_id__in=student_ids)
            .annotate(week=TruncWeek("created_at"))
            .values("week", "student__student_code", "student__full_name")
            .annotate(avg_value=Avg("predicted_value"))
            .order_by("week", "student__student_code")
        )
        result = [
            {
                "period": row["week"].isoformat(),
                "student_code": row["student__student_code"],
                "student_name": row["student__full_name"],
                "avg_value": round(row["avg_value"], 2),
            }
            for row in data
        ]
        return Response(result)


class TeacherAtRiskView(APIView):
    """
    GET /api/analytics/teacher/at-risk/
    Students in teacher's courses sorted by latest predicted_value ascending.
    """
    permission_classes = [IsTeacher]

    def get(self, request):
        student_ids = list(
            StudentProfile.objects
            .filter(course__teacher=request.user)
            .values_list("student_id", flat=True)
        )
        latest_ids = _latest_prediction_ids(student_ids)
        preds = (
            PredictionResult.objects
            .filter(id__in=latest_ids)
            .select_related("student")
            .order_by("predicted_value")
        )
        result = [
            {
                "student_id": p.student.id,
                "student_code": p.student.student_code,
                "student_name": p.student.full_name,
                "predicted_value": p.predicted_value,
                "risk_level": p.risk_level,
                "prediction_date": p.created_at.isoformat(),
            }
            for p in preds
        ]
        return Response(result)


# ─── STUDENT ANALYTICS ──────────────────────────────────────────


class StudentMyTrendView(APIView):
    """
    GET /api/analytics/student/my-trend/
    Authenticated student's prediction trend over time.
    """
    permission_classes = [IsStudent]

    def get(self, request):
        try:
            profile = request.user.student_profile
        except StudentProfile.DoesNotExist:
            return Response([])

        preds = (
            PredictionResult.objects
            .filter(student_id=profile.student_id)
            .order_by("created_at")
            .values("created_at", "predicted_value", "risk_level")
        )
        result = [
            {
                "date": p["created_at"].isoformat(),
                "predicted_value": p["predicted_value"],
                "risk_level": p["risk_level"],
            }
            for p in preds
        ]
        return Response(result)


class StudentMyRiskView(APIView):
    """
    GET /api/analytics/student/my-risk/
    Authenticated student's latest risk level and prediction.
    """
    permission_classes = [IsStudent]

    def get(self, request):
        try:
            profile = request.user.student_profile
        except StudentProfile.DoesNotExist:
            return Response({"risk_level": None, "predicted_value": None})

        latest = (
            PredictionResult.objects
            .filter(student_id=profile.student_id)
            .order_by("-created_at")
            .first()
        )
        if not latest:
            return Response({"risk_level": None, "predicted_value": None})

        return Response({
            "risk_level": latest.risk_level,
            "predicted_value": latest.predicted_value,
            "date": latest.created_at.isoformat(),
        })

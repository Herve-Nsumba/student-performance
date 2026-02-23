from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import PredictionResult
from .serializers import PredictionResultSerializer
from core.mixins import RoleFilteredQuerysetMixin


class PredictionResultViewSet(RoleFilteredQuerysetMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = PredictionResultSerializer
    permission_classes = [IsAuthenticated]
    role_filter_student_field = "student"

    def get_queryset(self):
        queryset = PredictionResult.objects.all()
        student_id = self.request.query_params.get("student_id")
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        queryset = self.get_role_filtered_queryset(queryset)
        return queryset.order_by("-created_at")

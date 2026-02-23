from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import StudentRecord
from .serializers import StudentRecordSerializer
from core.mixins import RoleFilteredQuerysetMixin
from core.permissions import IsAdminOrTeacher


class StudentRecordViewSet(RoleFilteredQuerysetMixin, viewsets.ModelViewSet):
    serializer_class = StudentRecordSerializer
    permission_classes = [IsAuthenticated]
    role_filter_student_field = "student"

    def get_queryset(self):
        queryset = StudentRecord.objects.all()
        student_id = self.request.query_params.get("student_id")
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        queryset = self.get_role_filtered_queryset(queryset)
        return queryset.order_by("-recorded_at")

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminOrTeacher()]
        return [IsAuthenticated()]

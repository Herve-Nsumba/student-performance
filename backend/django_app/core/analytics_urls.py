from django.urls import path
from .analytics import (
    AdminAverageTrendView,
    AdminStudentTrendsView,
    AdminRiskDistributionView,
    AdminClassComparisonView,
    TeacherClassTrendView,
    TeacherAtRiskView,
    StudentMyTrendView,
    StudentMyRiskView,
)

urlpatterns = [
    # Admin analytics
    path("admin/average-trend/", AdminAverageTrendView.as_view(), name="analytics-admin-avg-trend"),
    path("admin/student-trends/", AdminStudentTrendsView.as_view(), name="analytics-admin-student-trends"),
    path("admin/risk-distribution/", AdminRiskDistributionView.as_view(), name="analytics-admin-risk-dist"),
    path("admin/class-comparison/", AdminClassComparisonView.as_view(), name="analytics-admin-class-compare"),

    # Teacher analytics
    path("teacher/class-trend/", TeacherClassTrendView.as_view(), name="analytics-teacher-class-trend"),
    path("teacher/at-risk/", TeacherAtRiskView.as_view(), name="analytics-teacher-at-risk"),

    # Student analytics
    path("student/my-trend/", StudentMyTrendView.as_view(), name="analytics-student-my-trend"),
    path("student/my-risk/", StudentMyRiskView.as_view(), name="analytics-student-my-risk"),
]

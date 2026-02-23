from django.contrib import admin
from .models import StudentRecord

@admin.register(StudentRecord)
class StudentRecordAdmin(admin.ModelAdmin):
    list_display = ("student", "previous_scores", "attendance", "hours_studied", "tutoring_sessions", "recorded_at")
    list_filter = ("recorded_at",)

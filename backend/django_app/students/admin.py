from django.contrib import admin
from .models import Student

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("student_code", "full_name", "class_name", "created_at")
    search_fields = ("student_code", "full_name")


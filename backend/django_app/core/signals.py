"""
Post-save signals that auto-provision User accounts when domain objects
are created. Default password behaviour is gated behind DEBUG=True.
"""

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from students.models import Student
from core.models import User, Course, StudentProfile


DEFAULT_PASSWORD = "1234"


# ─── Student → auto-create User + StudentProfile ────────────────

@receiver(post_save, sender=Student)
def auto_provision_student_user(sender, instance, created, **kwargs):
    """When a Student row is created, create a matching STUDENT User + profile."""
    if not created:
        return
    # Already linked (e.g. created by seed_demo which does its own linking)
    if StudentProfile.objects.filter(student=instance).exists():
        return

    username = instance.student_code
    user, u_created = User.objects.get_or_create(
        username=username,
        defaults={
            "role": User.Role.STUDENT,
            "email": f"{username}@school.local",
        },
    )
    if u_created and settings.DEBUG:
        user.set_password(DEFAULT_PASSWORD)
        user.save()

    # Pick a default course (first available)
    default_course = Course.objects.first()

    StudentProfile.objects.get_or_create(
        user=user,
        student=instance,
        defaults={"course": default_course},
    )

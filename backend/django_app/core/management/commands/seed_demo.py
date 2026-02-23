from django.conf import settings
from django.core.management.base import BaseCommand
from core.models import User, Course, StudentProfile
from students.models import Student


DEFAULT_PASSWORD = "1234"


class Command(BaseCommand):
    help = (
        "Seed demo accounts (admin, teacher, student) with default password "
        "and link any existing Student records. Idempotent -- safe to re-run.\n"
        "Always resets passwords for known demo accounts so you can log in."
    )

    def _ensure_user(self, username, role, email, pw, **extra):
        """Create or update a user, always resetting the password."""
        user, created = User.objects.get_or_create(
            username=username,
            defaults={"role": role, "email": email, **extra},
        )
        # Always reset the password so re-running seed_demo fixes login issues
        user.set_password(pw)
        # Ensure role and email are correct even if user existed
        user.role = role
        user.email = email
        for k, v in extra.items():
            setattr(user, k, v)
        user.save()
        tag = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"  {tag} {role.lower()} user: {username}"))
        return user

    def handle(self, *args, **options):
        pw = DEFAULT_PASSWORD

        self.stdout.write(self.style.MIGRATE_HEADING("Seeding demo data..."))

        # -- 1. Admin ------------------------------------------
        self._ensure_user(
            "admin", "ADMIN", "admin@school.local", pw,
            is_staff=True, is_superuser=True,
        )

        # -- 2. Default teacher --------------------------------
        teacher = self._ensure_user(
            "teacher1", "TEACHER", "teacher1@school.local", pw,
        )

        # -- 3. Default course --------------------------------─
        course, created = Course.objects.get_or_create(
            name="General Performance",
            defaults={"teacher": teacher},
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"  Created course: {course.name}"))
        else:
            self.stdout.write(f"  Course '{course.name}' already exists -- OK.")

        # -- 4. Default student (so you can always log in as one) --─
        if not Student.objects.exists():
            st = Student.objects.create(
                student_code="student1",
                full_name="Demo Student",
                class_name="General Performance",
            )
            self.stdout.write(self.style.SUCCESS(
                f"  Created placeholder Student: {st.student_code}"
            ))

        # -- 5. Link every Student -> User + StudentProfile ----
        #    Handles both fresh DBs and DBs with old-style usernames
        #    (e.g. "student_std-001" -> migrated to "STD-001").
        linked = 0
        updated = 0
        old_users_to_delete = []

        for student in Student.objects.all():
            username = student.student_code  # new canonical username

            # Ensure a User exists with username = student_code
            user, u_created = User.objects.get_or_create(
                username=username,
                defaults={
                    "role": "STUDENT",
                    "email": f"{username}@school.local",
                },
            )
            # Always reset password
            user.set_password(pw)
            user.role = "STUDENT"
            user.save()

            # Check if profile already exists for this student
            existing_profile = StudentProfile.objects.filter(
                student=student
            ).select_related("user").first()

            if existing_profile:
                if existing_profile.user_id != user.id:
                    # Profile exists but points to old-style user (e.g. student_std-001)
                    old_user = existing_profile.user
                    existing_profile.user = user
                    existing_profile.course = existing_profile.course or course
                    existing_profile.save()
                    # Mark old user for cleanup
                    if old_user.username != username:
                        old_users_to_delete.append(old_user)
                    self.stdout.write(
                        f"    Migrated {student.student_code}: "
                        f"{old_user.username} -> {username}"
                    )
                    updated += 1
                else:
                    # Profile is correct, just password was refreshed
                    updated += 1
            else:
                # No profile yet -- create one
                StudentProfile.objects.create(
                    user=user,
                    student=student,
                    course=course,
                )
                linked += 1
                self.stdout.write(
                    f"    Linked {username} -> {student.full_name} -> {course.name}"
                )

        # -- 6. Clean up orphaned old-style user records ------
        orphan_count = 0
        for old_user in old_users_to_delete:
            # Only delete if they have no profile (we just migrated it away)
            if not StudentProfile.objects.filter(user=old_user).exists():
                self.stdout.write(f"    Removed orphan user: {old_user.username}")
                old_user.delete()
                orphan_count += 1

        # Also clean up any other orphaned student_ users without profiles
        orphaned_qs = User.objects.filter(
            username__startswith="student_",
            role="STUDENT",
        )
        for u in orphaned_qs:
            if not StudentProfile.objects.filter(user=u).exists():
                self.stdout.write(f"    Removed orphan user: {u.username}")
                u.delete()
                orphan_count += 1

        if orphan_count:
            self.stdout.write(f"  Cleaned up {orphan_count} orphaned user(s).")

        self.stdout.write(self.style.SUCCESS(
            f"\nSeeding complete. "
            f"{linked} new link(s), {updated} existing refreshed."
        ))
        self.stdout.write(
            f"\nDemo credentials (password = {pw} for all):\n"
            f"  admin          / {pw}\n"
            f"  teacher1       / {pw}\n"
            f"  <student_code> / {pw}   (e.g. student1 or STD-001)\n"
        )

        if not settings.DEBUG:
            self.stdout.write(self.style.WARNING(
                "\nWARNING:  DEBUG=False -- auto-provision signals will NOT set "
                "default passwords for newly created students/teachers.\n"
                "   In production, use proper password management."
            ))

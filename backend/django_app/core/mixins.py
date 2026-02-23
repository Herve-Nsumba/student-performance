from core.models import StudentProfile


class RoleFilteredQuerysetMixin:
    """
    Mixin for ViewSets that filters querysets by user role.

    Subclasses must define:
        role_filter_student_field: the ORM path from this model to the Student FK.
            - '' (empty string) for the Student model itself
            - 'student' for StudentRecord and PredictionResult

    Admin:   no filtering (sees everything).
    Teacher: sees students in their course(s).
    Student: sees only their own data.
    """

    role_filter_student_field = "student"  # override in subclass if needed

    def get_role_filtered_queryset(self, queryset):
        user = self.request.user

        if not user or not user.is_authenticated:
            return queryset.none()

        if user.role == "ADMIN":
            return queryset

        if user.role == "TEACHER":
            # Get all students in courses taught by this teacher
            student_ids = StudentProfile.objects.filter(
                course__teacher=user
            ).values_list("student_id", flat=True)

            if self.role_filter_student_field == "":
                # Filtering the Student model itself
                return queryset.filter(id__in=student_ids)
            else:
                lookup = f"{self.role_filter_student_field}__id__in"
                return queryset.filter(**{lookup: student_ids})

        if user.role == "STUDENT":
            try:
                profile = user.student_profile
                student_id = profile.student_id
            except StudentProfile.DoesNotExist:
                return queryset.none()

            if self.role_filter_student_field == "":
                return queryset.filter(id=student_id)
            else:
                lookup = f"{self.role_filter_student_field}__id"
                return queryset.filter(**{lookup: student_id})

        return queryset.none()

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to users with ADMIN role."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsTeacher(BasePermission):
    """Allow access only to users with TEACHER role."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "TEACHER"
        )


class IsStudent(BasePermission):
    """Allow access only to users with STUDENT role."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "STUDENT"
        )


class IsAdminOrTeacher(BasePermission):
    """Allow access to ADMIN or TEACHER roles."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("ADMIN", "TEACHER")
        )

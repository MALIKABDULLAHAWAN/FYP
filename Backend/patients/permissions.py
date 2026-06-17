from __future__ import annotations

from rest_framework.permissions import BasePermission
from accounts.models import UserRole
from patients.models import TherapistChildAssignment


def user_has_role(user, role_slug: str) -> bool:
    if not (user and user.is_authenticated):
        return False
    if getattr(user, "is_staff", False) and role_slug == "admin":
        return True
    return UserRole.objects.filter(user=user, role__slug=role_slug).exists()


class IsParent(BasePermission):
    def has_permission(self, request, view):
        return user_has_role(request.user, "parent")


class IsAdminOrTherapistOrParent(BasePermission):
    def has_permission(self, request, view):
        return (
            user_has_role(request.user, "admin") or 
            user_has_role(request.user, "therapist") or
            user_has_role(request.user, "parent")
        )


class CanAccessChild(BasePermission):
    """
    Object-level: 
    - Admin: all
    - Therapist: assigned
    - Parent: associated via Guardian record (email match)
    """
    def has_object_permission(self, request, view, obj):
        if user_has_role(request.user, "admin"):
            return True
        
        if user_has_role(request.user, "therapist"):
            return TherapistChildAssignment.objects.filter(therapist=request.user, child_user=obj.user).exists()
        
        if user_has_role(request.user, "parent"):
            from patients.models import Guardian
            return Guardian.objects.filter(child_profile=obj, email=request.user.email).exists()
            
        return False

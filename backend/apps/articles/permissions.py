"""Permissions personnalisées de l'application `articles`."""

from rest_framework import permissions


class IsAuthorOrReadOnly(permissions.BasePermission):
    """Autorise la lecture à tous, l'écriture au seul auteur (ou à un administrateur).

    Le cahier des charges demande que la mise à jour et la suppression d'un
    article soient réservées à son propriétaire.
    """

    message = "Vous ne pouvez modifier ou supprimer que vos propres articles."

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user or request.user.is_staff

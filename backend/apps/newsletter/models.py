"""Modèle des inscrits à la newsletter."""

import uuid

from django.db import models


class Subscriber(models.Model):
    """Adresse inscrite à la newsletter depuis le pied de page du site.

    On ne garde que l'email : c'est la seule donnée nécessaire (RGPD,
    minimisation). Le jeton de désinscription est secret et aléatoire : on ne
    peut pas désinscrire quelqu'un d'autre en devinant son adresse.
    """

    email = models.EmailField("adresse email", unique=True)
    unsubscribe_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField("inscrit le", auto_now_add=True)

    class Meta:
        verbose_name = "inscrit à la newsletter"
        verbose_name_plural = "inscrits à la newsletter"
        ordering = ["-created_at"]

    def __str__(self):
        return self.email

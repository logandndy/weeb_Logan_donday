"""Modèle des messages envoyés depuis le formulaire de contact."""

from django.db import models


class ContactMessage(models.Model):
    """Message déposé par un visiteur via la page Contact.

    Les champs reprennent exactement ceux du formulaire de la maquette : nom,
    prénom, email et message. Le champ `is_handled` permet à l'administrateur
    de suivre les messages déjà traités depuis l'admin Django.
    """

    last_name = models.CharField("nom", max_length=150)
    first_name = models.CharField("prénom", max_length=150)
    email = models.EmailField("adresse email")
    message = models.TextField("message")
    is_handled = models.BooleanField("traité", default=False)
    created_at = models.DateTimeField("reçu le", auto_now_add=True)

    class Meta:
        verbose_name = "message de contact"
        verbose_name_plural = "messages de contact"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} — {self.email}"

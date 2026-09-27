"""Modèle utilisateur personnalisé du projet Weeb.

Le cahier des charges impose une inscription avec prénom, nom, email et mot de
passe, ainsi qu'une validation du compte par un administrateur avant que
l'utilisateur puisse publier des articles. On remplace donc le modèle
`django.contrib.auth.models.User` (qui identifie par `username`) par un modèle
identifiant par email.
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Gestionnaire de création des utilisateurs identifiés par email."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """Crée et enregistre un utilisateur avec un email normalisé et un mot de passe hashé."""
        if not email:
            raise ValueError("L'adresse email est obligatoire.")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """Crée un utilisateur standard, inactif tant qu'un administrateur ne l'a pas validé."""
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("is_active", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        """Crée un administrateur, actif immédiatement (utilisé par `createsuperuser`)."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Un superutilisateur doit avoir is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Un superutilisateur doit avoir is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Utilisateur de la plateforme Weeb.

    Trois profils coexistent, comme demandé par le cahier des charges :

    - visiteur non authentifié : aucun enregistrement en base ;
    - utilisateur inscrit en attente de validation : `is_active=False`, il ne
      peut pas obtenir de token JWT ni publier d'article ;
    - utilisateur validé : `is_active=True`, il peut publier ses articles ;
    - administrateur : `is_staff=True`, il accède à l'admin Django.
    """

    email = models.EmailField(
        "adresse email",
        unique=True,
        help_text="Sert d'identifiant de connexion.",
    )
    first_name = models.CharField("prénom", max_length=150)
    last_name = models.CharField("nom", max_length=150)

    is_active = models.BooleanField(
        "compte validé",
        default=False,
        help_text="Décoché tant qu'un administrateur n'a pas validé le compte.",
    )
    is_staff = models.BooleanField(
        "membre de l'équipe",
        default=False,
        help_text="Autorise l'accès à l'interface d'administration.",
    )
    date_joined = models.DateTimeField("date d'inscription", default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        verbose_name = "utilisateur"
        verbose_name_plural = "utilisateurs"
        ordering = ["-date_joined"]

    def __str__(self):
        return self.email

    def get_full_name(self):
        """Retourne le prénom et le nom séparés par un espace."""
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        """Retourne le prénom, utilisé dans les emails et l'admin."""
        return self.first_name

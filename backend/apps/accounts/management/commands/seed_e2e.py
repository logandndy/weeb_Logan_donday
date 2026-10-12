"""Commande `python manage.py seed_e2e` : jeu de données des tests de bout en bout.

Les tests Playwright (dossier e2e/ à la racine) ont besoin de comptes et
d'articles connus à l'avance : un auteur validé, un compte en attente de
validation, un article publié et un brouillon.

La commande est idempotente (la relancer ne crée pas de doublon) et refuse de
tourner hors du mode DEBUG : elle crée des comptes au mot de passe connu, ce
qui ne doit jamais arriver sur la base de production.
"""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from apps.articles.models import Article

User = get_user_model()

E2E_PASSWORD = "MotDePasse!2026"

USERS = [
    # (email, prénom, nom, compte validé)
    ("e2e.auteur@weeb.fr", "Ada", "Lovelace", True),
    ("e2e.attente@weeb.fr", "Alan", "Turing", False),
    ("e2e.reset@weeb.fr", "Grace", "Hopper", True),
]


class Command(BaseCommand):
    help = "Crée (ou remet à l'état attendu) les données des tests E2E. Réservé au mode DEBUG."

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("seed_e2e crée des comptes de test : refusé hors DEBUG=True.")

        for email, first_name, last_name, active in USERS:
            user, _ = User.objects.update_or_create(
                email=email,
                defaults={"first_name": first_name, "last_name": last_name, "is_active": active},
            )
            user.set_password(E2E_PASSWORD)
            user.save()

        auteur = User.objects.get(email="e2e.auteur@weeb.fr")
        Article.objects.update_or_create(
            slug="article-e2e-publie",
            defaults={
                "title": "Article E2E publié",
                "excerpt": "Un article créé par le jeu de données des tests E2E.",
                "content": "Ce contenu sert aux tests de bout en bout. " * 3,
                "author": auteur,
                "is_published": True,
            },
        )
        Article.objects.update_or_create(
            slug="brouillon-e2e",
            defaults={
                "title": "Brouillon E2E",
                "content": "Ce brouillon ne doit jamais apparaître pour un visiteur. " * 2,
                "author": auteur,
                "is_published": False,
            },
        )

        self.stdout.write(self.style.SUCCESS("Données E2E prêtes."))

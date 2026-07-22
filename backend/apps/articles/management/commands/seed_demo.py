"""Commande de peuplement de la base avec des données de démonstration.

Usage :
    python manage.py seed_demo

Pratique pour tester le frontend sans devoir saisir des articles à la main.
La commande est idempotente : elle peut être relancée sans créer de doublons.
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.articles.models import Article

User = get_user_model()

DEMO_EMAIL = "demo@weeb.fr"
DEMO_PASSWORD = "DemoWeeb!2026"

DEMO_ARTICLES = [
    {
        "title": "Les tendances du web en 2026",
        "excerpt": "Frameworks, performance, accessibilité : ce qui compte vraiment cette année.",
        "content": (
            "Le web évolue vite, mais toutes les nouveautés ne se valent pas. "
            "Cette année, trois sujets ressortent nettement des retours de la communauté.\n\n"
            "Le premier est la performance perçue. Les utilisateurs jugent un site sur les "
            "premières secondes, bien avant d'en évaluer le contenu.\n\n"
            "Le deuxième est l'accessibilité, qui cesse d'être une contrainte de fin de projet "
            "pour devenir un critère de conception."
        ),
    },
    {
        "title": "Bien structurer un projet React",
        "excerpt": "Découper par fonctionnalité plutôt que par type de fichier.",
        "content": (
            "Ranger tous les composants dans un dossier `components` fonctionne tant que le "
            "projet reste petit. Passé une dizaine d'écrans, la recherche devient pénible.\n\n"
            "Regrouper les fichiers par page ou par fonctionnalité limite les allers-retours : "
            "tout ce qui concerne une page se trouve au même endroit.\n\n"
            "Les éléments réellement partagés, eux, restent dans un dossier commun."
        ),
    },
    {
        "title": "Une API REST propre avec Django",
        "excerpt": "Sérialiseurs, permissions et tests : les trois piliers d'une API tenable.",
        "content": (
            "Django REST Framework fournit beaucoup de comportements par défaut. Le piège est "
            "de tout accepter sans se demander ce que l'on expose réellement.\n\n"
            "Un sérialiseur dédié à la liste et un autre au détail évitent d'envoyer le contenu "
            "complet de chaque article sur une page qui n'en affiche que le résumé.\n\n"
            "Les permissions personnalisées, elles, gardent la règle métier au même endroit "
            "plutôt que dispersée dans chaque vue."
        ),
    },
]


class Command(BaseCommand):
    help = "Crée un utilisateur de démonstration et quelques articles."

    def handle(self, *args, **options):
        author, created = User.objects.get_or_create(
            email=DEMO_EMAIL,
            defaults={"first_name": "Ada", "last_name": "Lovelace", "is_active": True},
        )

        if created:
            author.set_password(DEMO_PASSWORD)
            author.save()
            self.stdout.write(f"Utilisateur de démonstration créé : {DEMO_EMAIL} / {DEMO_PASSWORD}")
        else:
            self.stdout.write(f"Utilisateur de démonstration déjà présent : {DEMO_EMAIL}")

        for data in DEMO_ARTICLES:
            article, article_created = Article.objects.get_or_create(
                title=data["title"],
                defaults={**data, "author": author},
            )
            verbe = "créé" if article_created else "déjà présent"
            self.stdout.write(f"Article {verbe} : {article.title}")

        self.stdout.write(self.style.SUCCESS("Données de démonstration prêtes."))

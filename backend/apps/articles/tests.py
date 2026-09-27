"""Tests du CRUD des articles et des droits d'accès associés."""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Article

User = get_user_model()

VALID_PASSWORD = "MotDePasse!2026"


def creer_utilisateur(email, prenom="Ada", nom="Lovelace"):
    """Raccourci de création d'un utilisateur validé."""
    return User.objects.create_user(
        email=email,
        password=VALID_PASSWORD,
        first_name=prenom,
        last_name=nom,
        is_active=True,
    )


class ArticleLectureTests(APITestCase):
    """La lecture des articles doit rester ouverte aux visiteurs non authentifiés."""

    def setUp(self):
        self.auteur = creer_utilisateur("ada@weeb.fr")
        self.article = Article.objects.create(
            title="Les tendances du web en 2026",
            content="Un contenu suffisamment long pour passer la validation du sérialiseur.",
            author=self.auteur,
        )

    def test_liste_accessible_sans_authentification(self):
        response = self.client.get("/api/articles/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_detail_accessible_sans_authentification(self):
        response = self.client.get(f"/api/articles/{self.article.slug}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], self.article.title)

    def test_les_brouillons_sont_masques_aux_visiteurs(self):
        Article.objects.create(
            title="Brouillon en cours de rédaction",
            content="Un contenu suffisamment long pour passer la validation du sérialiseur.",
            author=self.auteur,
            is_published=False,
        )

        response = self.client.get("/api/articles/")

        self.assertEqual(response.data["count"], 1)


class ArticleEcritureTests(APITestCase):
    """Seul un utilisateur authentifié et validé peut créer un article."""

    def setUp(self):
        self.auteur = creer_utilisateur("ada@weeb.fr")

    def test_creation_refusee_sans_authentification(self):
        response = self.client.post(
            "/api/articles/",
            {"title": "Un titre valide", "content": "x" * 60},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_creation_rattache_larticle_a_son_auteur(self):
        self.client.force_authenticate(self.auteur)

        response = self.client.post(
            "/api/articles/",
            {
                "title": "Les tendances du web en 2026",
                "excerpt": "Un tour d'horizon des nouveautés.",
                "content": "Un contenu suffisamment long pour passer la validation.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["author"]["full_name"], "Ada Lovelace")
        self.assertEqual(response.data["slug"], "les-tendances-du-web-en-2026")

    def test_creation_refuse_un_contenu_trop_court(self):
        self.client.force_authenticate(self.auteur)

        response = self.client.post(
            "/api/articles/",
            {"title": "Un titre valide", "content": "trop court"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_slug_unique_en_cas_de_titres_identiques(self):
        commun = {"title": "Un titre partagé", "content": "x" * 60, "author": self.auteur}
        premier = Article.objects.create(**commun)
        second = Article.objects.create(**commun)

        self.assertNotEqual(premier.slug, second.slug)


class ArticlePermissionsTests(APITestCase):
    """La modification et la suppression sont réservées au propriétaire."""

    def setUp(self):
        self.auteur = creer_utilisateur("ada@weeb.fr")
        self.autre = creer_utilisateur("bob@weeb.fr", prenom="Bob", nom="Martin")
        self.article = Article.objects.create(
            title="Les tendances du web en 2026",
            content="Un contenu suffisamment long pour passer la validation du sérialiseur.",
            author=self.auteur,
        )
        self.url = f"/api/articles/{self.article.slug}/"

    def test_un_autre_utilisateur_ne_peut_pas_modifier(self):
        self.client.force_authenticate(self.autre)

        response = self.client.patch(self.url, {"title": "Titre détourné"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_un_autre_utilisateur_ne_peut_pas_supprimer(self):
        self.client.force_authenticate(self.autre)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Article.objects.filter(pk=self.article.pk).exists())

    def test_le_proprietaire_peut_modifier(self):
        self.client.force_authenticate(self.auteur)

        response = self.client.patch(self.url, {"title": "Un titre mis à jour"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.article.refresh_from_db()
        self.assertEqual(self.article.title, "Un titre mis à jour")

    def test_le_proprietaire_peut_supprimer(self):
        self.client.force_authenticate(self.auteur)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Article.objects.filter(pk=self.article.pk).exists())

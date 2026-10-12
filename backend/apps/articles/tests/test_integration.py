"""Tests d'intégration du CRUD des articles et de la matrice des droits.

Profils testés : visiteur (non connecté), auteur de l'article, autre
utilisateur validé, administrateur. Les requêtes connectées utilisent un
vrai token JWT, comme le frontend.
"""

from datetime import timedelta

from django.test import tag
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.articles.models import Article
from weeb_api.tests.factories import auth_client, make_admin, make_article, make_user

CONTENU = "Un contenu suffisamment long pour passer la validation du sérialiseur."


class ArticleTestCase(APITestCase):
    """Base commune : un auteur, un autre utilisateur, un admin, un article publié et un brouillon."""

    def setUp(self):
        self.auteur = make_user("ada@weeb.fr")
        self.autre = make_user("bob@weeb.fr", first_name="Bob", last_name="Martin")
        self.admin = make_admin()
        self.article = make_article(self.auteur, title="Les tendances du web en 2026", content=CONTENU)
        self.brouillon = make_article(self.auteur, title="Brouillon en cours", published=False)

    def slugs_de_la_liste(self):
        return {a["slug"] for a in self.client.get("/api/articles/").data["results"]}


@tag("integration")
class ArticleLectureTests(ArticleTestCase):
    """La lecture des articles publiés reste ouverte aux visiteurs non authentifiés."""

    def test_liste_accessible_sans_authentification(self):
        response = self.client.get("/api/articles/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_detail_accessible_sans_authentification(self):
        response = self.client.get(f"/api/articles/{self.article.slug}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], self.article.title)

    def test_les_brouillons_sont_masques_aux_visiteurs(self):
        response = self.client.get("/api/articles/")

        self.assertEqual(response.data["count"], 1)

    def test_la_liste_n_envoie_pas_le_contenu(self):
        resultat = self.client.get("/api/articles/").data["results"][0]

        self.assertNotIn("content", resultat)

    def test_les_plus_recents_en_premier(self):
        ancien = make_article(self.auteur, title="Article ancien")
        recent = make_article(self.auteur, title="Article récent")
        # Dates forcées : l'horloge de Windows est trop peu précise pour
        # départager des articles créés à quelques microsecondes d'écart.
        maintenant = timezone.now()
        Article.objects.filter(pk=self.article.pk).update(created_at=maintenant - timedelta(days=2))
        Article.objects.filter(pk=ancien.pk).update(created_at=maintenant - timedelta(days=1))
        Article.objects.filter(pk=recent.pk).update(created_at=maintenant)

        slugs = [a["slug"] for a in self.client.get("/api/articles/").data["results"]]

        self.assertEqual(slugs, [recent.slug, ancien.slug, self.article.slug])


@tag("integration")
class ArticlePaginationTests(ArticleTestCase):
    """10 articles par page (PAGE_SIZE) : avec 11 articles publiés, il y a 2 pages."""

    def setUp(self):
        super().setUp()
        for i in range(10):
            make_article(self.auteur, title=f"Article numéro {i}")

    def test_premiere_page_de_10_avec_lien_suivant(self):
        response = self.client.get("/api/articles/")

        self.assertEqual(response.data["count"], 11)
        self.assertEqual(len(response.data["results"]), 10)
        self.assertIsNotNone(response.data["next"])

    def test_deuxieme_page_avec_le_dernier_article(self):
        response = self.client.get("/api/articles/?page=2")

        self.assertEqual(len(response.data["results"]), 1)
        self.assertIsNone(response.data["next"])

    def test_page_inexistante_renvoie_404(self):
        response = self.client.get("/api/articles/?page=99")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


@tag("integration")
class ArticleVisibiliteTests(ArticleTestCase):
    """Un brouillon n'est visible que par son auteur et par les administrateurs."""

    def test_liste_visiteur_publies_seulement(self):
        self.assertEqual(self.slugs_de_la_liste(), {self.article.slug})

    def test_liste_auteur_publies_et_ses_brouillons(self):
        auth_client(self.client, self.auteur)

        self.assertEqual(self.slugs_de_la_liste(), {self.article.slug, self.brouillon.slug})

    def test_liste_autre_utilisateur_sans_les_brouillons_des_autres(self):
        auth_client(self.client, self.autre)

        self.assertEqual(self.slugs_de_la_liste(), {self.article.slug})

    def test_liste_admin_voit_tout(self):
        auth_client(self.client, self.admin)

        self.assertEqual(self.slugs_de_la_liste(), {self.article.slug, self.brouillon.slug})

    def test_detail_d_un_brouillon_selon_le_profil(self):
        """404 et non 403 : on ne révèle même pas qu'un brouillon existe à cette adresse."""
        url = f"/api/articles/{self.brouillon.slug}/"
        attendus = [
            (None, status.HTTP_404_NOT_FOUND),
            (self.auteur, status.HTTP_200_OK),
            (self.autre, status.HTTP_404_NOT_FOUND),
            (self.admin, status.HTTP_200_OK),
        ]
        for user, code in attendus:
            with self.subTest(profil=user.email if user else "visiteur"):
                self.client.credentials()  # repart sans token
                if user:
                    auth_client(self.client, user)

                self.assertEqual(self.client.get(url).status_code, code)


@tag("integration")
class ArticleCreationTests(ArticleTestCase):
    """Seul un utilisateur authentifié et validé peut créer un article."""

    def test_creation_refusee_sans_authentification(self):
        response = self.client.post(
            "/api/articles/", {"title": "Un titre valide", "content": "x" * 60}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_creation_refusee_si_le_compte_a_ete_suspendu(self):
        """Le token a été délivré avant la suspension : il ne doit plus permettre de publier."""
        auth_client(self.client, self.autre)
        self.autre.is_active = False
        self.autre.save()

        response = self.client.post(
            "/api/articles/", {"title": "Un titre valide", "content": "x" * 60}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_creation_rattache_larticle_a_son_auteur(self):
        auth_client(self.client, self.autre)

        response = self.client.post(
            "/api/articles/",
            {
                "title": "Mon premier article",
                "excerpt": "Un tour d'horizon des nouveautés.",
                "content": CONTENU,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["author"]["full_name"], "Bob Martin")
        self.assertEqual(response.data["slug"], "mon-premier-article")

    def test_auteur_et_slug_envoyes_par_le_client_sont_ignores(self):
        auth_client(self.client, self.autre)

        response = self.client.post(
            "/api/articles/",
            {"title": "Article de Bob", "content": CONTENU, "author": self.auteur.pk, "slug": "pirate"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["author"]["id"], self.autre.pk)
        self.assertEqual(response.data["slug"], "article-de-bob")

    def test_creation_refuse_un_contenu_trop_court(self):
        auth_client(self.client, self.autre)

        response = self.client.post(
            "/api/articles/", {"title": "Un titre valide", "content": "trop court"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


@tag("integration")
class ArticlePermissionsTests(ArticleTestCase):
    """Modification et suppression : l'auteur ou un administrateur, personne d'autre."""

    def setUp(self):
        super().setUp()
        self.url = f"/api/articles/{self.article.slug}/"

    def test_un_visiteur_ne_peut_ni_modifier_ni_supprimer(self):
        self.assertEqual(
            self.client.patch(self.url, {"title": "Titre visiteur"}, format="json").status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.assertEqual(self.client.delete(self.url).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_un_autre_utilisateur_ne_peut_pas_modifier(self):
        auth_client(self.client, self.autre)

        response = self.client.patch(self.url, {"title": "Titre détourné"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_un_autre_utilisateur_ne_peut_pas_supprimer(self):
        auth_client(self.client, self.autre)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Article.objects.filter(pk=self.article.pk).exists())

    def test_le_proprietaire_peut_modifier(self):
        auth_client(self.client, self.auteur)

        response = self.client.patch(self.url, {"title": "Un titre mis à jour"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.article.refresh_from_db()
        self.assertEqual(self.article.title, "Un titre mis à jour")

    def test_le_proprietaire_peut_tout_remplacer_avec_put(self):
        auth_client(self.client, self.auteur)

        response = self.client.put(
            self.url, {"title": "Titre remplacé", "content": CONTENU}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_sans_contenu_est_refuse(self):
        """PUT remplace tout l'article : les champs obligatoires doivent être présents."""
        auth_client(self.client, self.auteur)

        response = self.client.put(self.url, {"title": "Titre remplacé"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_modifier_le_titre_ne_change_pas_le_slug(self):
        auth_client(self.client, self.auteur)

        response = self.client.patch(self.url, {"title": "Un tout autre titre"}, format="json")

        self.assertEqual(response.data["slug"], self.article.slug)

    def test_le_proprietaire_peut_supprimer(self):
        auth_client(self.client, self.auteur)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Article.objects.filter(pk=self.article.pk).exists())

    def test_un_admin_peut_modifier_et_supprimer_l_article_d_un_autre(self):
        """La modération : un administrateur peut retirer un article qui pose problème."""
        auth_client(self.client, self.admin)

        modif = self.client.patch(self.url, {"title": "Titre modéré"}, format="json")
        suppression = self.client.delete(self.url)

        self.assertEqual(modif.status_code, status.HTTP_200_OK)
        self.assertEqual(suppression.status_code, status.HTTP_204_NO_CONTENT)

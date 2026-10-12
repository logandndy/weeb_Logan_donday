"""Tests unitaires de l'application `articles`.

Modèle (génération du slug), sérialiseurs (règles de validation) et
permission « auteur seulement », testés isolément, sans requête HTTP.
"""

from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.test import SimpleTestCase, TestCase, tag

from apps.articles.models import Article
from apps.articles.permissions import IsAuthorOrReadOnly
from apps.articles.serializers import ArticleDetailSerializer, ArticleListSerializer
from weeb_api.tests.factories import make_article, make_user

User = get_user_model()


@tag("unit")
class ArticleModelTests(TestCase):
    """Le slug sert d'adresse à l'article (/blog/<slug>) : il doit être lisible, unique et stable."""

    def setUp(self):
        self.auteur = make_user()

    def test_str_affiche_le_titre(self):
        self.assertEqual(str(Article(title="Mon article")), "Mon article")

    def test_slug_genere_depuis_un_titre_accentue(self):
        article = make_article(self.auteur, title="Élégance du Web")

        self.assertEqual(article.slug, "elegance-du-web")

    def test_slug_unique_en_cas_de_titres_identiques(self):
        premier = make_article(self.auteur, title="Un titre partagé")
        second = make_article(self.auteur, title="Un titre partagé")

        self.assertNotEqual(premier.slug, second.slug)

    def test_doublons_numerotes_2_puis_3(self):
        slugs = [make_article(self.auteur, title="Même titre").slug for _ in range(3)]

        self.assertEqual(slugs, ["meme-titre", "meme-titre-2", "meme-titre-3"])

    def test_titre_sans_lettre_donne_le_slug_article(self):
        article = make_article(self.auteur, title="!!! ???")

        self.assertEqual(article.slug, "article")

    def test_slug_fourni_est_conserve(self):
        article = make_article(self.auteur, title="Un titre", slug="mon-slug-perso")

        self.assertEqual(article.slug, "mon-slug-perso")

    def test_slug_inchange_quand_le_titre_change(self):
        """Changer le titre ne doit pas casser les liens déjà partagés vers l'article."""
        article = make_article(self.auteur, title="Titre de départ")

        article.title = "Titre corrigé"
        article.save()

        self.assertEqual(article.slug, "titre-de-depart")

    def test_reenregistrer_ne_rajoute_pas_de_suffixe(self):
        article = make_article(self.auteur, title="Titre stable")

        article.save()
        article.save()

        self.assertEqual(article.slug, "titre-stable")

    def test_article_publie_par_defaut(self):
        article = Article.objects.create(author=self.auteur, title="Titre", content="x" * 60)

        self.assertTrue(article.is_published)


@tag("unit")
class ArticleDetailSerializerTests(SimpleTestCase):
    """Règles de validation du formulaire d'article (création et modification)."""

    def serializer(self, **modifs):
        data = {"title": "Un titre valide", "content": "x" * 60}
        data.update(modifs)
        return ArticleDetailSerializer(data=data)

    def test_titre_de_4_caracteres_refuse_avec_un_message_clair(self):
        serializer = self.serializer(title="abcd")

        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["title"], ["Le titre doit contenir au moins 5 caractères."])

    def test_titre_de_5_caracteres_accepte(self):
        self.assertTrue(self.serializer(title="abcde").is_valid())

    def test_les_espaces_autour_du_titre_ne_comptent_pas(self):
        """Le titre « abcd » entouré d'espaces fait 10 caractères mais seulement 4 de vrai texte : refusé."""
        self.assertFalse(self.serializer(title="   abcd   ").is_valid())

        serializer = self.serializer(title="  Bonjour  ")
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["title"], "Bonjour")

    def test_contenu_de_49_caracteres_refuse(self):
        serializer = self.serializer(content="x" * 49)

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors["content"], ["Le contenu doit contenir au moins 50 caractères."]
        )

    def test_contenu_de_50_caracteres_accepte(self):
        self.assertTrue(self.serializer(content="x" * 50).is_valid())

    def test_image_de_couverture_doit_etre_une_url(self):
        serializer = self.serializer(cover_image="pas une url")

        self.assertFalse(serializer.is_valid())
        self.assertIn("cover_image", serializer.errors)

    def test_slug_auteur_et_id_envoyes_sont_ignores(self):
        """Ces champs sont gérés par le serveur : le client ne peut pas les imposer."""
        serializer = self.serializer(slug="slug-impose", author=99, id=42)

        self.assertTrue(serializer.is_valid())
        for champ in ("slug", "author", "id"):
            self.assertNotIn(champ, serializer.validated_data)


@tag("unit")
class ArticleListSerializerTests(SimpleTestCase):
    """La liste n'envoie pas le contenu complet, pour garder une réponse légère."""

    def test_liste_sans_contenu_ni_statut(self):
        article = Article(
            id=1,
            title="Titre",
            slug="titre",
            content="x" * 60,
            author=User(id=1, first_name="Ada", last_name="Lovelace"),
        )

        data = ArticleListSerializer(article).data

        self.assertNotIn("content", data)
        self.assertNotIn("is_published", data)
        self.assertEqual(data["author"], {"id": 1, "full_name": "Ada Lovelace"})


@tag("unit")
class IsAuthorOrReadOnlyTests(SimpleTestCase):
    """Permission testée avec de faux objets : pas besoin de base ni de requête HTTP."""

    def setUp(self):
        self.permission = IsAuthorOrReadOnly()
        self.auteur = User(pk=1, is_staff=False)
        self.article = SimpleNamespace(author=self.auteur)

    def autorise(self, method, user):
        request = SimpleNamespace(method=method, user=user)
        return self.permission.has_object_permission(request, None, self.article)

    def test_lecture_autorisee_a_tous(self):
        for method in ("GET", "HEAD", "OPTIONS"):
            with self.subTest(method=method):
                self.assertTrue(self.autorise(method, AnonymousUser()))

    def test_ecriture_autorisee_a_l_auteur(self):
        self.assertTrue(self.autorise("PATCH", User(pk=1)))

    def test_ecriture_refusee_a_un_autre_utilisateur(self):
        self.assertFalse(self.autorise("DELETE", User(pk=2, is_staff=False)))

    def test_ecriture_autorisee_a_un_administrateur(self):
        self.assertTrue(self.autorise("PUT", User(pk=3, is_staff=True)))

    def test_ecriture_refusee_a_un_visiteur(self):
        self.assertFalse(self.autorise("PATCH", AnonymousUser()))

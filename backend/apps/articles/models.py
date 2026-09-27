"""Modèle représentant un article du blog Weeb."""

from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Article(models.Model):
    """Article publié sur le blog.

    L'article est rattaché à son auteur : lui seul (ou un administrateur) peut
    le modifier ou le supprimer. Le `slug` sert d'identifiant dans les URLs
    côté frontend, à la place de l'identifiant numérique.
    """

    title = models.CharField("titre", max_length=200)
    slug = models.SlugField(
        "slug",
        max_length=220,
        unique=True,
        blank=True,
        help_text="Généré automatiquement à partir du titre s'il est laissé vide.",
    )
    excerpt = models.CharField(
        "accroche",
        max_length=300,
        blank=True,
        help_text="Résumé court affiché dans la liste des articles.",
    )
    content = models.TextField("contenu")
    cover_image = models.URLField(
        "image de couverture",
        blank=True,
        help_text="URL de l'image illustrant l'article.",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="articles",
        verbose_name="auteur",
    )
    is_published = models.BooleanField(
        "publié",
        default=True,
        help_text="Un article non publié n'apparaît que pour son auteur.",
    )
    created_at = models.DateTimeField("créé le", auto_now_add=True)
    updated_at = models.DateTimeField("modifié le", auto_now=True)

    class Meta:
        verbose_name = "article"
        verbose_name_plural = "articles"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["-created_at"])]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        """Génère un slug unique à partir du titre lorsqu'aucun n'est fourni."""
        if not self.slug:
            self.slug = self._build_unique_slug()
        super().save(*args, **kwargs)

    def _build_unique_slug(self):
        """Construit un slug basé sur le titre, suffixé d'un compteur en cas de doublon."""
        base_slug = slugify(self.title)[:200] or "article"
        candidate = base_slug
        counter = 2

        while Article.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
            candidate = f"{base_slug}-{counter}"
            counter += 1

        return candidate

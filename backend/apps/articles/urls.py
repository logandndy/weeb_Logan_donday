"""Routes des articles, préfixées par `/api/`."""

from rest_framework.routers import DefaultRouter

from .views import ArticleViewSet

app_name = "articles"

router = DefaultRouter()
router.register("articles", ArticleViewSet, basename="article")

urlpatterns = router.urls

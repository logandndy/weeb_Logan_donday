"""Routes de la newsletter, préfixées par `/api/newsletter/`."""

from django.urls import path

from .views import SubscribeView, UnsubscribeView

app_name = "newsletter"

urlpatterns = [
    path("", SubscribeView.as_view(), name="subscribe"),
    path("unsubscribe/", UnsubscribeView.as_view(), name="unsubscribe"),
]

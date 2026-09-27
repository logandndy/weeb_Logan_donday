"""Routes du formulaire de contact, préfixées par `/api/`."""

from django.urls import path

from .views import ContactMessageCreateView

app_name = "contact"

urlpatterns = [
    path("contact/", ContactMessageCreateView.as_view(), name="contact-create"),
]

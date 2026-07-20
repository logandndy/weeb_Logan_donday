"""Routes d'authentification, préfixées par `/api/auth/`."""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
    CurrentUserView,
    LoginView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    SignupView,
)

app_name = "accounts"

urlpatterns = [
    path("signup/", SignupView.as_view(), name="signup"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("verify/", TokenVerifyView.as_view(), name="token-verify"),
    path("me/", CurrentUserView.as_view(), name="me"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path(
        "password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
]

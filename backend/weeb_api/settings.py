"""Configuration Django du projet Weeb."""

from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# En production, il faudrait générer une nouvelle clé, passer DEBUG à False et
# renseigner ALLOWED_HOSTS. Ces valeurs conviennent au développement.
SECRET_KEY = "django-insecure-4b8w2n7qk9zx1p6v3m0t5c8hj2df7gl4sr9ba6ye1uo3wn5qkd"
DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1"]


# --- Applications -----------------------------------------------------------

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
]

LOCAL_APPS = [
    "apps.accounts",
    "apps.articles",
    "apps.contact",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS


MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "weeb_api.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "weeb_api.wsgi.application"


# --- Base de données --------------------------------------------------------
# SQLite suffit pour le développement et l'évaluation du projet.

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# --- Authentification -------------------------------------------------------
# Le modèle utilisateur est personnalisé : l'identifiant de connexion est
# l'email et non un nom d'utilisateur.

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# --- Django REST Framework --------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}


# --- CORS -------------------------------------------------------------------
# Le frontend React (Vite) tourne sur un port différent de celui de l'API.

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


# --- Envoi d'emails ---------------------------------------------------------
# En développement, les emails (réinitialisation de mot de passe) sont écrits
# dans la console plutôt qu'envoyés réellement.

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = "no-reply@weeb.local"

# URL du frontend, utilisée pour construire le lien de réinitialisation.
FRONTEND_URL = "http://localhost:5173"


# --- Internationalisation ---------------------------------------------------

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Europe/Paris"
USE_I18N = True
USE_TZ = True


# --- Fichiers statiques et médias -------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

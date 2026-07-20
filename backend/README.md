# Weeb — API REST (backend Django)

API REST alimentant le blog Weeb : authentification, articles et formulaire de
contact. Le frontend React se trouve à la racine du dépôt.

## Stack

| Outil | Version | Rôle |
|---|---|---|
| Django | 6.0 | Framework web et admin auto-généré |
| Django REST Framework | 3.17 | Sérialisation, vues API, permissions |
| SimpleJWT | 5.5 | Authentification par tokens JWT |
| django-cors-headers | 4.9 | Autorise les appels depuis le frontend Vite |
| python-dotenv | 1.2 | Chargement de la configuration depuis `.env` |
| SQLite | — | Base de données de développement |

Django 6.0 est requis : c'est la première version compatible avec Python 3.14.

## Installation

```bash
cd backend

python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

pip install -r requirements.txt

copy .env.example .env         # Windows
# cp .env.example .env         # macOS / Linux

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

L'API écoute sur `http://127.0.0.1:8000/`, l'admin sur `http://127.0.0.1:8000/admin/`.

## Structure du projet

```
backend/
├── manage.py                  Point d'entrée des commandes Django
├── requirements.txt           Dépendances Python
├── .env.example               Modèle de configuration (le .env n'est pas versionné)
├── postman/                   Collection Postman de test des endpoints
├── weeb_api/                  Configuration du projet
│   ├── settings.py            Réglages (apps, DRF, JWT, CORS, base de données)
│   ├── urls.py                Table de routage racine
│   └── wsgi.py / asgi.py      Points d'entrée serveur
└── apps/                      Applications métier
    ├── accounts/              Utilisateurs et authentification
    ├── articles/              Articles du blog
    └── contact/               Messages du formulaire de contact
```

Chaque application suit le même découpage :

| Fichier | Responsabilité |
|---|---|
| `models.py` | Structure des données et règles portées par la base |
| `serializers.py` | Validation des entrées, formatage des sorties |
| `views.py` | Logique des endpoints |
| `permissions.py` | Règles d'accès spécifiques (application `articles`) |
| `urls.py` | Routes de l'application |
| `admin.py` | Configuration de l'admin Django |
| `tests.py` | Tests automatisés des endpoints |

Les applications sont regroupées dans `apps/` plutôt qu'à la racine afin de
séparer clairement le code métier de la configuration du projet.

## Endpoints

Base : `http://127.0.0.1:8000/api`

### Authentification

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/auth/signup/` | public | Inscription (prénom, nom, email, mot de passe) |
| POST | `/auth/login/` | public | Connexion, retourne les tokens JWT et le profil |
| POST | `/auth/refresh/` | public | Renouvelle le token d'accès |
| POST | `/auth/verify/` | public | Vérifie la validité d'un token |
| GET | `/auth/me/` | authentifié | Profil de l'utilisateur connecté |
| POST | `/auth/password-reset/` | public | Envoie un lien de réinitialisation par email |
| POST | `/auth/password-reset/confirm/` | public | Applique le nouveau mot de passe |

### Articles

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/articles/` | public | Liste paginée des articles publiés |
| POST | `/articles/` | authentifié + validé | Création d'un article |
| GET | `/articles/<slug>/` | public | Détail d'un article |
| PUT / PATCH | `/articles/<slug>/` | auteur uniquement | Mise à jour |
| DELETE | `/articles/<slug>/` | auteur uniquement | Suppression |

### Contact

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/contact/` | public | Enregistre un message du formulaire de contact |

## Gestion des rôles

Trois profils, conformément au cahier des charges :

| Profil | `is_active` | `is_staff` | Droits |
|---|---|---|---|
| Visiteur non authentifié | — | — | Lecture du blog, formulaire de contact, inscription, connexion |
| Inscrit en attente de validation | `False` | `False` | Aucun : la connexion est refusée (401) |
| Utilisateur validé | `True` | `False` | Publie, modifie et supprime **ses** articles |
| Administrateur | `True` | `True` | Admin Django, gestion des utilisateurs et de tous les articles |

Un compte créé via `/auth/signup/` est enregistré avec `is_active=False`.
L'administrateur le valide depuis `http://127.0.0.1:8000/admin/`, soit en
cochant « compte validé », soit via l'action groupée
« Valider les comptes sélectionnés ».

La restriction « seul le propriétaire peut modifier son article » est portée par
la permission `IsAuthorOrReadOnly` ([apps/articles/permissions.py](apps/articles/permissions.py)).

## Authentification côté client

Après un `POST /auth/login/` réussi, l'API retourne :

```json
{
  "access": "<token d'accès, valable 30 minutes>",
  "refresh": "<token de rafraîchissement, valable 7 jours>",
  "user": { "id": 1, "email": "...", "full_name": "..." }
}
```

Les requêtes authentifiées doivent porter l'en-tête :

```
Authorization: Bearer <access>
```

## Réinitialisation du mot de passe

1. `POST /auth/password-reset/` avec l'email ;
2. en développement, l'email est écrit dans la console du serveur Django et
   contient un lien de la forme
   `http://localhost:5173/reset-password?uid=...&token=...` ;
3. le frontend récupère `uid` et `token` et les renvoie à
   `POST /auth/password-reset/confirm/` avec le nouveau mot de passe.

La réponse à l'étape 1 est identique que l'email existe ou non, afin de ne pas
révéler quels comptes sont enregistrés.

## Tests

24 tests couvrent les endpoints, les validations et les droits d'accès :

```bash
python manage.py test apps
```

Une collection Postman est également fournie dans
[postman/Weeb_API.postman_collection.json](postman/Weeb_API.postman_collection.json).
Elle enregistre automatiquement les tokens après la requête *Login*.

## Configuration

Toutes les valeurs sensibles sont lues depuis `.env` (non versionné). Voir
[.env.example](.env.example) pour la liste des variables et leur rôle.

En production, il faut au minimum : générer une nouvelle `DJANGO_SECRET_KEY`,
passer `DJANGO_DEBUG` à `False`, renseigner `DJANGO_ALLOWED_HOSTS`, restreindre
`CORS_ALLOWED_ORIGINS` et configurer un vrai backend d'envoi d'emails.

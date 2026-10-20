# Weeb — blog sur le web

Site vitrine + blog + espace d'authentification.
Front **React (Vite)** dans [frontend/](frontend/), API **Django REST** dans [backend/](backend/).

| | URL |
|---|---|
| Site | https://weeb-logan-donday.vercel.app |
| API / santé | https://weeb-api-tjw9.onrender.com/api/health/ |
| Admin | https://weeb-api-tjw9.onrender.com/admin/ |

> API sur l'offre gratuite de Render : la première requête après une pause peut prendre ~1 min.

Le dossier DevOps (semaine 3) est dans [docs/REX.md](docs/REX.md).

## Démarrage en local

```bash
# Backend — port 8000
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env        # active le mode développement
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

```bash
# Frontend — port 5173
cd frontend
npm install
npm run dev
```

Variante : `docker compose up --build` lance l'API + PostgreSQL, comme en production.

Le backend est **sécurisé par défaut** : sans `.env`, il démarre en mode
production et exige une vraie `SECRET_KEY`. Variables principales :

| Variable | Rôle |
|---|---|
| `DEBUG` | `True` en local uniquement |
| `SECRET_KEY` | Obligatoire en production (générée par Render) |
| `DATABASE_URL` | PostgreSQL (Neon) en prod, vide = SQLite |
| `CORS_ALLOWED_ORIGINS` · `FRONTEND_URL` | URL du front |
| `SENTRY_DSN` | Monitoring des erreurs (vide = désactivé) |
| `BREVO_API_KEY` · `DEFAULT_FROM_EMAIL` | Envoi réel des emails (vide = console) |
| `VITE_API_URL` (front) | URL de l'API |

## Architecture

```
frontend/src/
├── components/   Navbar, Footer, ProtectedRoute, FormField, Pagination
├── context/      Session utilisateur (AuthProvider)
├── hooks/        useAuth, useFetch (chargements), useForm (formulaires), useScrollReveal
├── pages/        Un dossier par page
├── services/     api.js : tous les appels à l'API
├── styles/       Une feuille CSS par zone
└── utils/        format.js : dates en français
backend/
├── weeb_api/     Configuration (settings, urls, route de santé)
└── apps/         accounts · articles · contact · newsletter
e2e/              Tests de bout en bout (Playwright)
docs/REX.md       Dossier DevOps
```

```
React (Vercel) ──HTTPS/JSON + JWT──> Django REST (Render) ──> PostgreSQL (Neon)
```

**Choix structurants**

- **Front découpé par page**, pas par type de fichier : tout ce qui concerne une page est au même endroit.
- **Un seul point d'accès à l'API** ([api.js](frontend/src/services/api.js)) : URL, token et erreurs gérés une fois.
- **CSS écrit à la main** : la maquette impose une identité précise, pas de framework à contourner. Toutes les valeurs (couleurs, arrondis, ombres, durées) sont des variables dans [theme.css](frontend/src/styles/theme.css), avec un seul système de boutons (`.btn` + `.btn-primary`, `.btn-outline`, `.btn-ghost`, `.btn-danger`).
- **Back découpé en 3 apps** (une par domaine), chacune avec `models`, `serializers`, `views`, `urls`, `admin`, `tests/`.

## Bibliothèques

| Front | Pourquoi |
|---|---|
| `react` | Imposé |
| `react-router-dom` | Navigation, URL `/blog/:slug`, routes protégées |
| `@sentry/react` | Erreurs JavaScript des visiteurs |
| `vite` · `eslint` · `vitest` | Build, qualité, tests |

| Back | Pourquoi |
|---|---|
| `Django` | Imposé : ORM, admin, mots de passe |
| `djangorestframework` | API REST (serializers, permissions, pagination) |
| `djangorestframework-simplejwt` | Tokens JWT : front et API sont sur deux domaines |
| `django-cors-headers` | Seul le front peut appeler l'API |
| `dj-database-url` · `psycopg` | SQLite en local, PostgreSQL en prod |
| `whitenoise` · `gunicorn` | Fichiers statiques et serveur de production |
| `django-anymail` | Emails via l'API Brevo (Render gratuit bloque le SMTP) |
| `sentry-sdk` · `python-dotenv` | Monitoring, lecture du `.env` |

## Fonctionnement

| Route front | Accès | API |
|---|---|---|
| `/` · `/contact` | public | `POST /contact/` |
| `/blog` · `/blog/:slug` | public (brouillon : son auteur) | `GET /articles/` · `/articles/<slug>/` |
| `/blog/nouveau` | connecté | `POST /articles/` |
| `/blog/:slug/modifier` | auteur ou admin | `PATCH` · `DELETE /articles/<slug>/` |
| `/login` · `/signup` | public | `POST /auth/login/` · `/auth/signup/` |
| `/mot-de-passe-oublie` · `/reset-password` | public | `POST /auth/password-reset/` · `/confirm/` |
| `/mon-espace` | connecté | `GET /articles/?mine=true` · `GET` `PATCH` `DELETE /auth/me/` · `POST /auth/password-change/` |
| `/confidentialite` | public | aucune |
| pied de page · `/newsletter/desinscription` | public | `POST /newsletter/` · `/newsletter/unsubscribe/` |

Autres routes API : `/auth/me/`, `/auth/refresh/`, `/auth/logout/`, `/health/`
(API + base), `/ping/` (API seule, pour les sondes fréquentes).

**Responsive** : points de rupture à 1150, 1024 (tablette), 992, 768 (menu
burger), 640 et 600 px. **Interactions** : survol sur liens, boutons et cartes ;
focus violet et label flottant sur les champs ; contour clavier
(`:focus-visible`) ; transitions de 0,3 s ; apparition au défilement.

**Hors maquette** : bande défilante des partenaires, menu burger animé,
inscription, mot de passe oublié, pagination, brouillons, page 404, page active
dans la navbar, page **Mon espace** (mes articles et brouillons, profil, mot de
passe, suppression du compte), **vraie newsletter** et page **Confidentialité**,
couverture générée pour les articles sans image (dégradé propre à chaque
article), article **à la une**, temps de lecture, bouton pour **afficher le mot
de passe**, fond avec halo et grain, pied de page toujours en bas.

## Authentification et sécurité

1. **Inscription** : compte créé **inactif**, mot de passe vérifié par les validateurs Django puis haché. Les admins reçoivent un email.
2. **Validation** : un admin active le compte (action « Valider les comptes sélectionnés »). La personne reçoit un email. Avant, la connexion renvoie `401`.
3. **Connexion** : token d'accès (30 min) + token de rafraîchissement (7 jours), renouvelé automatiquement par `api.js`. Chaque renouvellement grille l'ancien token (liste noire).
4. **Déconnexion** : le token de rafraîchissement est mis sur liste noire côté serveur.
5. **Mot de passe oublié** : lien signé à usage unique, envoyé seulement aux comptes actifs. Réponse identique que l'email existe ou non.
6. **Changement ou réinitialisation du mot de passe, suspension par un admin** : toutes les sessions du compte sont coupées.

| Profil | Lire | Écrire | Admin |
|---|:---:|:---:|:---:|
| Visiteur | oui | non | non |
| Inscrit non validé | oui | non | non |
| Utilisateur validé | oui | ses articles | non |
| Administrateur | oui | tous | oui |

**Sécurité des routes**

- API **fermée par défaut** (`IsAuthenticated`), routes publiques ouvertes une par une.
- `IsAuthorOrReadOnly` : seul l'auteur (ou un admin) modifie ou supprime. L'auteur est fixé par le serveur.
- **Limitation des requêtes** par IP : 5 connexions par minute. Par heure : 10 inscriptions, 5 resets, 5 changements de mot de passe, 10 messages, 10 inscriptions à la newsletter. Au-delà : `429`.
- Les actions sensibles redemandent le mot de passe : changer de mot de passe, supprimer son compte.
- Production : `DEBUG=False` par défaut, HTTPS forcé + HSTS, CORS limité au front, aucun secret dans Git. La CI vérifie tout ça (`check --deploy`).
- `ProtectedRoute` côté front n'est **pas** une sécurité : c'est le backend qui refuse.

**RGPD** : données minimales (prénom, nom, email), mots de passe hachés,
hébergement dans l'UE (Francfort), Sentry sans données personnelles. Page
`/confidentialite` et mention sous chaque formulaire. Droit à l'effacement
depuis Mon espace, désinscription de la newsletter par lien, messages de
contact supprimés après 12 mois (`python manage.py purger_contacts`).

## Prise en main du code

- **Front** : [App.jsx](frontend/src/App.jsx) (routes) → [api.js](frontend/src/services/api.js) (lien avec le back) → [AuthContext.jsx](frontend/src/context/AuthContext.jsx) (session) → [Blog.jsx](frontend/src/pages/Blog/Blog.jsx) (page type qui charge des données).
- **Back** : [urls.py](backend/weeb_api/urls.py) (toutes les routes) → [articles/views.py](backend/apps/articles/views.py) + [permissions.py](backend/apps/articles/permissions.py) (CRUD et droits) → [accounts/serializers.py](backend/apps/accounts/serializers.py) (inscription, connexion, reset).

Les pages qui chargent des données suivent toutes le même schéma : états
`data` / `isLoading` / `error`, et un drapeau `isStale` qui ignore la réponse si
l'utilisateur a quitté la page entre-temps. Les erreurs Django
(`{"email": ["..."]}`) s'affichent sous le champ concerné.

| Convention | Règle |
|---|---|
| Composants React | PascalCase |
| Fonctions, variables JS | camelCase (hooks : `use…`) |
| Python | classes PascalCase, fonctions snake_case |
| CSS | kebab-case préfixé par le bloc (`.article-card-meta`) |
| Commentaires | en français, expliquent le *pourquoi* |

## Tests

| Niveau | Outil | Tests |
|---|---|---|
| Unitaire (back) | Django, `test_unit.py` | 76 |
| Intégration (back) | Django + client HTTP, `test_integration.py` | 86 |
| Front | Vitest + Testing Library | 38 |
| Bout en bout | Playwright (Chromium) | 10 parcours |

```bash
cd backend && python manage.py test               # --tag unit / --tag integration
cd frontend && npm run lint && npm test
cd e2e && npm install && npx playwright install chromium && npx playwright test
```

Playwright lance lui-même l'API (port 8001) et le front (port 5174) sur une base
recréée à chaque run. Détails dans le [REX](docs/REX.md#7-tests).

## DevOps et Git

```
push ─> backend (tests) ─┬─> docker (image + /api/health/)
     └> frontend (tests) ┴─> e2e (Playwright) ─> deploy Render + Vercel (main uniquement)
```

CI/CD GitHub Actions, API conteneurisée sur Render, base Neon, front Vercel,
monitoring Sentry + UptimeRobot. Tout est expliqué dans [docs/REX.md](docs/REX.md).

Branches : `main` (production) ← `develop` ← `feat/*`, `fix/*`, `docs/*`.
Cycle : issue → branche → PR → CI verte → merge → suppression de la branche.
Commits *Conventional Commits* : `feat:`, `fix:`, `test:`, `docs:`, `ci:`.

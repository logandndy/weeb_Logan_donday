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

**Prérequis** : **Python 3.13** et **Node.js 24**. Ce sont les versions de la
production et de la CI, fixées dans [.python-version](.python-version) et
[.nvmrc](.nvmrc). Python 3.12 fonctionne aussi (minimum requis par Django 6).

```bash
# Backend — port 8000
cd backend
python -m venv venv
venv\Scripts\activate             # Windows
source venv/bin/activate          # Linux / macOS
pip install -r requirements.txt
copy .env.example .env            # Windows (Linux / macOS : cp), active le mode développement
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

```bash
# Frontend — port 5173
cd frontend
npm install
npm run dev                       # relaie /api vers le backend (port 8000)
```

Variante : `docker compose up --build` lance l'API + PostgreSQL, comme en production.

Le backend est **sécurisé par défaut** : sans `.env`, il démarre en mode
production et exige une vraie `SECRET_KEY`. Variables principales :

| Variable | Rôle |
|---|---|
| `DEBUG` | `True` en local uniquement |
| `SECRET_KEY` | Obligatoire en production (générée par Render) |
| `DATABASE_URL` | PostgreSQL (Neon) en prod, vide = SQLite |
| `FRONTEND_URL` | URL du front, pour les liens des emails |
| `NUM_PROXIES` | Nombre de proxys devant l'API, pour lire la vraie IP du visiteur |
| `SENTRY_DSN` | Monitoring des erreurs (vide = désactivé) |
| `BREVO_API_KEY` · `DEFAULT_FROM_EMAIL` | Envoi réel des emails (vide = console) |
| `VITE_SENTRY_DSN` (front) | Monitoring des erreurs du navigateur (vide = désactivé) |

Le front n'a pas besoin de l'adresse de l'API : il appelle `/api` sur son
propre domaine. Vercel ([vercel.json](frontend/vercel.json)) et Vite
([vite.config.js](frontend/vite.config.js)) relaient ces appels vers Django.

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
Navigateur ──> weeb-logan-donday.vercel.app ─┬─ pages React (fichiers statiques)
                                             └─ /api/* relayé ──> Django REST (Render) ──> PostgreSQL (Neon)
```

**Choix structurants**

- **Front découpé par page**, pas par type de fichier : tout ce qui concerne une page est au même endroit.
- **Un seul point d'accès à l'API** ([api.js](frontend/src/services/api.js)) : URL, token et erreurs gérés une fois.
- **L'API passe par le domaine du site** (`/api`, relayé par Vercel) : pas de CORS, et un cookie de session qui reste interne au site.
- **CSS écrit à la main** : la maquette impose une identité précise, pas de framework à contourner. Toutes les valeurs (couleurs, arrondis, ombres, durées) sont des variables dans [theme.css](frontend/src/styles/theme.css), avec un seul système de boutons (`.btn` + `.btn-primary`, `.btn-outline`, `.btn-ghost`, `.btn-danger`).
- **Back découpé en 4 apps** (une par domaine), chacune avec `models`, `serializers`, `views`, `urls`, `admin`, `tests/`.

## Bibliothèques

| Front | Pourquoi |
|---|---|
| `react` | Imposé |
| `react-router-dom` | Navigation, URL `/blog/:slug`, routes protégées |
| `@fontsource-variable/inter` | Police servie par le site, sans appel à Google |
| `@sentry/react` | Erreurs JavaScript des visiteurs |
| `vite` · `eslint` · `vitest` | Build, qualité, tests |

| Back | Pourquoi |
|---|---|
| `Django` | Imposé : ORM, admin, mots de passe |
| `djangorestframework` | API REST (serializers, permissions, pagination) |
| `djangorestframework-simplejwt` | Tokens JWT, rotation et liste noire |
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
de passe**, fond avec halo et grain, pied de page toujours en bas, titre
d'onglet propre à chaque page.

## Authentification et sécurité

1. **Inscription** : compte créé **inactif**, mot de passe vérifié par les validateurs Django puis haché. Les admins reçoivent un email. Si l'adresse a déjà un compte, la réponse est **exactement la même** (rien n'est créé, le titulaire est prévenu par email) : impossible de tester des adresses pour savoir qui est inscrit.
2. **Validation** : un admin active le compte (action « Valider les comptes sélectionnés »). La personne reçoit un email. Avant, la connexion renvoie `401`.
3. **Connexion** : token d'accès (30 min) gardé **en mémoire**, token de rafraîchissement (7 jours) dans un **cookie HttpOnly**. `api.js` renouvelle le token d'accès tout seul, une seule fois même si plusieurs appels expirent ensemble. Chaque renouvellement grille l'ancien token (liste noire).
4. **Déconnexion** : le token du cookie est mis sur liste noire côté serveur, puis le cookie est effacé.
5. **Mot de passe oublié** : lien signé à usage unique, envoyé seulement aux comptes actifs. Réponse identique que l'email existe ou non.
6. **Changement ou réinitialisation du mot de passe, suspension par un admin** : toutes les sessions du compte sont coupées.

Les emails partent **en arrière-plan** ([mail.py](backend/weeb_api/mail.py)) : le
temps de réponse ne trahit pas non plus si un compte existe.

**Pourquoi un cookie HttpOnly et pas le localStorage** : un script injecté (faille
XSS) peut lire tout le localStorage, donc voler le token de 7 jours. Un cookie
`HttpOnly` est illisible par le JavaScript. Il est aussi `Secure` (HTTPS
seulement), `SameSite=Strict` (jamais envoyé depuis un autre site, donc pas de
CSRF) et limité au chemin `/api/auth/`. Un cookie `SameSite` ne fonctionne
qu'entre pages d'un même site. Or `vercel.app` et `onrender.com` sont deux sites
différents. C'est pourquoi l'API passe par le domaine du front.

| Profil | Lire | Écrire | Admin |
|---|:---:|:---:|:---:|
| Visiteur | oui | non | non |
| Inscrit non validé | oui | non | non |
| Utilisateur validé | oui | ses articles | non |
| Administrateur | oui | tous | oui |

**Sécurité des routes**

- API **fermée par défaut** (`IsAuthenticated`), routes publiques ouvertes une par une.
- `IsAuthorOrReadOnly` : seul l'auteur (ou un admin) modifie ou supprime. L'auteur est fixé par le serveur.
- **Limitation des requêtes** par IP : 5 connexions par minute. Par heure : 10 inscriptions, 5 resets, 5 changements de mot de passe, 5 suppressions de compte, 10 messages, 10 inscriptions à la newsletter. Au-delà : `429`. Les compteurs sont gardés en base, communs aux deux workers.
- Les actions sensibles redemandent le mot de passe : changer de mot de passe, supprimer son compte.
- Production : `DEBUG=False` par défaut, HTTPS forcé + HSTS, aucun secret dans Git. La CI vérifie tout ça (`check --deploy`).
- Front : **Content-Security-Policy** stricte (scripts, styles et polices du site seulement), `nosniff`, `Referrer-Policy`, `Permissions-Policy` ([vercel.json](frontend/vercel.json)).
- `ProtectedRoute` côté front n'est **pas** une sécurité : c'est le backend qui refuse.

**RGPD** : données minimales (prénom, nom, email), mots de passe hachés,
hébergement dans l'UE (Francfort), Sentry sans données personnelles. Page
`/confidentialite` et mention sous chaque formulaire. Droit à l'effacement
depuis Mon espace, désinscription de la newsletter par lien, messages de
contact supprimés après 12 mois (`purger_contacts`, lancée à chaque démarrage
du conteneur). Aucune requête vers un service tiers pour afficher une page.

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
| Unitaire (back) | Django, `test_unit.py` | 79 |
| Intégration (back) | Django + client HTTP, `test_integration.py` | 94 |
| Front | Vitest + Testing Library | 49 |
| Bout en bout | Playwright (Chromium) | 12 parcours |

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
monitoring Sentry + UptimeRobot, dépendances suivies par Dependabot. Tout est
expliqué dans [docs/REX.md](docs/REX.md).

Branches : `main` (production) ← `develop` ← `feat/*`, `fix/*`, `docs/*`.
Cycle : issue → branche → PR → CI verte → merge → suppression de la branche.
Commits *Conventional Commits* : `feat:`, `fix:`, `test:`, `docs:`, `ci:`.

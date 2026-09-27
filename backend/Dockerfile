# Image du backend Weeb (Django + gunicorn).
# Image "slim" : Debian minimale, bien plus légère que l'image Python complète.
FROM python:3.13-slim

# Pas de fichiers .pyc, logs affichés immédiatement (utile pour le monitoring).
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Les dépendances sont copiées et installées AVANT le code : tant que
# requirements.txt ne change pas, Docker réutilise cette couche en cache
# et le build ne réinstalle rien.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Fichiers statiques (CSS de l'admin) préparés une fois pour toutes au build.
RUN python manage.py collectstatic --noinput

# L'application ne tourne pas en root : si elle était compromise,
# l'attaquant n'aurait pas les droits d'administrateur du conteneur.
RUN useradd --create-home appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

# Docker vérifie lui-même que l'API répond, via la route de santé.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen(f'http://localhost:{os.environ[\"PORT\"]}/api/health/')"

# Au démarrage : on applique les migrations puis on lance gunicorn.
# 2 workers : suffisant pour le trafic du blog et adapté aux 512 Mo de l'offre gratuite.
CMD python manage.py migrate --noinput && \
    gunicorn weeb_api.wsgi:application --bind 0.0.0.0:${PORT} --workers 2 --access-logfile -

"""Commande `python manage.py purger_contacts` : supprime les vieux messages de contact.

La politique de confidentialité annonce que les messages sont conservés 12 mois
au plus. Cette commande applique la règle. Elle peut être lancée à la main
depuis l'administration du serveur, ou planifiée (une fois par mois suffit).
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.contact.models import ContactMessage

DUREE_DE_CONSERVATION = timedelta(days=365)


class Command(BaseCommand):
    help = "Supprime les messages de contact reçus il y a plus de 12 mois (RGPD)."

    def handle(self, *args, **options):
        limite = timezone.now() - DUREE_DE_CONSERVATION
        supprimes, _ = ContactMessage.objects.filter(created_at__lt=limite).delete()
        self.stdout.write(self.style.SUCCESS(f"{supprimes} message(s) de plus de 12 mois supprimé(s)."))

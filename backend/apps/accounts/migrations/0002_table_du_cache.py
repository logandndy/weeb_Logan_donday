"""Crée la table du cache, où sont gardés les compteurs de limitation de débit.

Passer par une migration évite une commande de plus à retenir : `migrate`
suffit, en local, en CI et au démarrage du conteneur.
"""

from django.core.management import call_command
from django.db import migrations


def creer_table_du_cache(apps, schema_editor):
    call_command("createcachetable", database=schema_editor.connection.alias)


class Migration(migrations.Migration):
    dependencies = [("accounts", "0001_initial")]

    operations = [migrations.RunPython(creer_table_du_cache, migrations.RunPython.noop)]

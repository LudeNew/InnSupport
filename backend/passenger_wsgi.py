
import sys, os

# Adjust paths as needed
INTERP = "/usr/bin/python3" # Typically for shared hosting, might need adjustment
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

sys.path.append(os.getcwd())
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

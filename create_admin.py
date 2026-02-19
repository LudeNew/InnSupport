
import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

User = get_user_model()
username = 'admin'
password = 'admin12345'
email = 'admin@example.com'

if not User.objects.filter(username=username).exists():
    print(f"Creating superuser {username}...")
    User.objects.create_superuser(username=username, email=email, password=password)
    print("Superuser created.")
else:
    print(f"User {username} already exists.")

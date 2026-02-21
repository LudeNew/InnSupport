
from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if not User.objects.filter(username='admin').exists():
                print("Auto-creating superuser 'admin'...")
                User.objects.create_superuser('admin', 'admin@example.com', 'admin12345')
                print("Superuser 'admin' created successfully.")
        except Exception as e:
            # Prevents issues during initial migrations where tables might not exist yet
            pass


import os
import django
import sys

# Set up Django environment
from django.conf import settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Now import rest_framework AFTER settings are configured
from rest_framework.serializers import Serializer
from api.serializers import TicketSerializer
from api.models import Project, User

def debug_create_ticket():
    try:
        user = User.objects.filter(username='admin').first()
        if not user:
             print("No admin user found! Run create_admin or manage.py first.")
             return

        project = Project.objects.first()
        if not project:
            print("No projects found! Create a project via frontend first.")
            return

        print(f"Using Project ID: {project.id}")

        data = {
            'title': 'Debug Ticket',
            'description': 'Created via debug script',
            'priority': 'MEDIUM',
            'status': 'OPEN',
            'project': project.id,
            'assignee': None,
            'tags': []
        }

        print(f"Testing Payload: {data}")

        # Mimic request context if needed
        # But verify plain serializer works first
        serializer = TicketSerializer(data=data)
        
        if serializer.is_valid():
            print("\n---------- SUCCESS ----------")
            print("Serializer IS VALID.")
            # validated_data = serializer.validated_data
            # print(f"Validated Data: {validated_data}")
        else:
            print("\n!!! SERIALIZER ERRORS !!!")
            print(serializer.errors)
            print("==========================\n")

    except Exception as e:
        print(f"Exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_create_ticket()


import os
import django
import sys
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth.models import User

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.serializers import TicketSerializer
from api.models import Project

def debug_create_ticket():
    try:
        user = User.objects.get(username='admin')
        project = Project.objects.first()
        
        if not project:
            print("No projects found! Create a project first.")
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

        # Check validation directly via Serializer (this mimics what the View does)
        serializer = TicketSerializer(data=data, context={'request': None}) # Context request needed for active_timer_id but maybe optional
        
        if serializer.is_valid():
            print("Serializer IS VALID.")
            # We won't save because that requires request.user in perform_create, 
            # but is_valid() is enough to check for 400 errors.
        else:
            print("\n!!! SERIALIZER ERRORS !!!")
            print(serializer.errors)
            print("==========================\n")

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    debug_create_ticket()

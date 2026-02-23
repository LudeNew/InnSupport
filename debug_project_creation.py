
import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Project
from api.serializers import ProjectSerializer

try:
    print("Attempting to create project via Serializer...")
    data = {
        'name': 'Test Project',
        'description': 'Test Description',
        'status': 'ACTIVE', # Extra field
        'type': 'INTERNAL'  # Extra field
    }
    serializer = ProjectSerializer(data=data)
    if serializer.is_valid():
        print("Serializer is valid.")
        project = serializer.save()
        print(f"Project created: {project.id} - {project.name}")
    else:
        print(f"Serializer errors: {serializer.errors}")
except Exception as e:
    print(f"Caught exception: {e}")
    import traceback
    traceback.print_exc()

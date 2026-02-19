
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', obtain_auth_token, name='api_token_auth'),
    path('api/', include('api.urls')),
    
    # Catch-all for Frontend (React)
    # re_path(r'^.*$', TemplateView.as_view(template_name='index.html')), # Initially commented out until frontend is built
]

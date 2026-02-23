from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # ВОТ ОН - правильный путь для логина!
    path('api/token/', obtain_auth_token, name='api_token_auth'),
    path('api/', include('api.urls')),
]

# Раздача медиа-файлов (вложений)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token  # <-- ВЕРНУЛИ ИМПОРТ ДЛЯ АВТОРИЗАЦИИ
from .views import (
    ProjectViewSet, TicketViewSet, WorkLogViewSet, DashboardView, 
    UserViewSet, TagViewSet, WorkTypeViewSet, TicketCommentViewSet, 
    TicketNoteViewSet, TicketAttachmentViewSet, NotificationViewSet
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'tickets', TicketViewSet)
router.register(r'comments', TicketCommentViewSet)
router.register(r'notes', TicketNoteViewSet)
router.register(r'attachments', TicketAttachmentViewSet) # Вложения
router.register(r'notifications', NotificationViewSet, basename='notifications') # Уведомления
router.register(r'worklogs', WorkLogViewSet)
router.register(r'users', UserViewSet)
router.register(r'tags', TagViewSet)
router.register(r'worktypes', WorkTypeViewSet)
router.register(r'dashboard', DashboardView, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
    path('api-token-auth/', obtain_auth_token),
]
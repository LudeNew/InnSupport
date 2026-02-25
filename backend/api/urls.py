from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, ProjectReleaseViewSet, ProjectStageViewSet, TicketViewSet, 
    WorkLogViewSet, DashboardView, UserViewSet, ProfileViewSet, TagViewSet, 
    WorkTypeViewSet, TicketCommentViewSet, TicketNoteViewSet, TicketAttachmentViewSet, 
    NotificationViewSet, CompanyEventViewSet, EventLabelViewSet, SkillViewSet
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'releases', ProjectReleaseViewSet)
router.register(r'stages', ProjectStageViewSet)
router.register(r'tickets', TicketViewSet)
router.register(r'comments', TicketCommentViewSet)
router.register(r'notes', TicketNoteViewSet)
router.register(r'attachments', TicketAttachmentViewSet)
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'event-labels', EventLabelViewSet)
router.register(r'events', CompanyEventViewSet, basename='events')
router.register(r'worklogs', WorkLogViewSet)
router.register(r'skills', SkillViewSet)
router.register(r'users', UserViewSet, basename='users')
router.register(r'profiles', ProfileViewSet)
router.register(r'tags', TagViewSet)
router.register(r'worktypes', WorkTypeViewSet)
router.register(r'dashboard', DashboardView, basename='dashboard')

urlpatterns = [
    # Железобетонно фиксируем кастомный путь, чтобы избежать 404
    path('users/me/', UserViewSet.as_view({'get': 'me', 'patch': 'me'}), name='user-me'),
    path('', include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, TicketViewSet, WorkLogViewSet, DashboardView, UserViewSet, TagViewSet, WorkTypeViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'tickets', TicketViewSet)
router.register(r'worklogs', WorkLogViewSet)
router.register(r'users', UserViewSet)
router.register(r'tags', TagViewSet)
router.register(r'worktypes', WorkTypeViewSet)

# Dashboard is a ViewSet but treated as singleton list usually, or we route it differently
router.register(r'dashboard', DashboardView, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]


from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from .models import Project, ProjectStage, Tag, Ticket, WorkType, WorkLog, TimeTrack
from .serializers import *

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset

    @action(detail=True, methods=['post'])
    def start_timer(self, request, pk=None):
        ticket = self.get_object()
        # Check if already tracking
        if TimeTrack.objects.filter(user=request.user, end_time__isnull=True).exists():
            return Response({'error': 'You already have an active timer.'}, status=status.HTTP_400_BAD_REQUEST)
        
        TimeTrack.objects.create(user=request.user, ticket=ticket)
        return Response({'status': 'started'})

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['post'])
    def stop_timer(self, request, pk=None):
        ticket = self.get_object()
        active_track = TimeTrack.objects.filter(user=request.user, ticket=ticket, end_time__isnull=True).first()
        if not active_track:
            return Response({'error': 'No active timer for this ticket.'}, status=status.HTTP_400_BAD_REQUEST)
        
        active_track.end_time = timezone.now()
        active_track.save()
        
        # Calculate duration and add to WorkLog? 
        duration = active_track.end_time - active_track.start_time
        minutes = int(duration.total_seconds() / 60)
        
        # We can auto-create a worklog or let user fill it. For now, just return duration.
        return Response({'status': 'stopped', 'duration_minutes': minutes})

class WorkLogViewSet(viewsets.ModelViewSet):
    queryset = WorkLog.objects.all()
    serializer_class = WorkLogSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DashboardView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        user = request.user
        
        # New tickets (last 24h?) or assigned to me
        assigned_tickets = Ticket.objects.filter(assignee=user, status__in=['OPEN', 'IN_PROGRESS'])
        
        # Recent activity (WorkLogs)
        recent_logs = WorkLog.objects.all().order_by('-created_at')[:10]
        
        stats = {
            'assigned_count': assigned_tickets.count(),
            'total_projects': Project.objects.count(),
            'my_worked_minutes_today': WorkLog.objects.filter(user=user, created_at__date=timezone.now().date()).aggregate(Sum('time_spent_minutes'))['time_spent_minutes__sum'] or 0
        }
        
        return Response({
            'stats': stats,
            'assigned_tickets': TicketSerializer(assigned_tickets, many=True).data,
            'recent_logs': WorkLogSerializer(recent_logs, many=True).data
        })

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class WorkTypeViewSet(viewsets.ModelViewSet):
    queryset = WorkType.objects.all()
    serializer_class = WorkTypeSerializer

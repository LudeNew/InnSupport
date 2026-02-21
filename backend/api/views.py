from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from .models import Project, ProjectStage, Tag, Ticket, TicketComment, WorkType, WorkLog, TimeTrack, TicketNote, TicketHistory, TicketAttachment, Notification
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
        if TimeTrack.objects.filter(user=request.user, end_time__isnull=True).exists():
            return Response({'error': 'You already have an active timer.'}, status=status.HTTP_400_BAD_REQUEST)
        work_type_id = request.data.get('work_type')
        TimeTrack.objects.create(user=request.user, ticket=ticket, work_type_id=work_type_id)
        return Response({'status': 'started'})

    def perform_create(self, serializer):
        ticket = serializer.save(creator=self.request.user)
        # Уведомляем исполнителя, если задачу создали и сразу назначили на кого-то другого
        if ticket.assignee and ticket.assignee != self.request.user:
            Notification.objects.create(
                user=ticket.assignee,
                message=f"На вас назначена новая задача #{ticket.id}: {ticket.title}",
                link=f"/tickets/{ticket.id}"
            )

    @action(detail=True, methods=['post'])
    def stop_timer(self, request, pk=None):
        ticket = self.get_object()
        active_track = TimeTrack.objects.filter(user=request.user, ticket=ticket, end_time__isnull=True).first()
        if not active_track:
            return Response({'error': 'No active timer for this ticket.'}, status=status.HTTP_400_BAD_REQUEST)
        
        active_track.end_time = timezone.now()
        active_track.save()
        duration = active_track.end_time - active_track.start_time
        minutes = int(duration.total_seconds() / 60)
        
        if minutes > 0:
            WorkLog.objects.create(
                ticket=ticket, user=request.user, work_type=active_track.work_type,
                time_spent_minutes=minutes, comment="Автоматический трекинг"
            )
        return Response({'status': 'stopped', 'duration_minutes': minutes})

    def perform_update(self, serializer):
        old_instance = self.get_object()
        updated_instance = serializer.save()
        
        changes = []
        if old_instance.status != updated_instance.status:
            changes.append(f"статус с '{old_instance.get_status_display()}' на '{updated_instance.get_status_display()}'")
        if old_instance.priority != updated_instance.priority:
            changes.append(f"приоритет с '{old_instance.get_priority_display()}' на '{updated_instance.get_priority_display()}'")
            
        if changes:
            TicketHistory.objects.create(ticket=updated_instance, user=self.request.user, action="Изменил " + ", ".join(changes))
            
        # Уведомляем о смене исполнителя
        if old_instance.assignee != updated_instance.assignee and updated_instance.assignee:
            Notification.objects.create(
                user=updated_instance.assignee,
                message=f"На вас переназначена задача #{updated_instance.id}: {updated_instance.title}",
                link=f"/tickets/{updated_instance.id}"
            )

class TicketCommentViewSet(viewsets.ModelViewSet):
    queryset = TicketComment.objects.all()
    serializer_class = TicketCommentSerializer
    def perform_create(self, serializer):
        comment = serializer.save(author=self.request.user)
        # Уведомляем исполнителя о новом комментарии
        ticket = comment.ticket
        if ticket.assignee and ticket.assignee != self.request.user:
            Notification.objects.create(
                user=ticket.assignee,
                message=f"Новый комментарий в задаче #{ticket.id} от {self.request.user.username}",
                link=f"/tickets/{ticket.id}"
            )

class TicketNoteViewSet(viewsets.ModelViewSet):
    queryset = TicketNote.objects.all()
    serializer_class = TicketNoteSerializer
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class TicketAttachmentViewSet(viewsets.ModelViewSet):
    queryset = TicketAttachment.objects.all()
    serializer_class = TicketAttachmentSerializer
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'ok'})

class WorkLogViewSet(viewsets.ModelViewSet):
    queryset = WorkLog.objects.all()
    serializer_class = WorkLogSerializer
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DashboardView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    def list(self, request):
        user = request.user
        assigned_tickets = Ticket.objects.filter(assignee=user, status__in=['OPEN', 'IN_PROGRESS'])
        recent_logs = WorkLog.objects.all().order_by('-created_at')[:10]
        stats = {
            'assigned_count': assigned_tickets.count(),
            'total_projects': Project.objects.count(),
            'my_worked_minutes_today': WorkLog.objects.filter(user=user, created_at__date=timezone.now().date()).aggregate(Sum('time_spent_minutes'))['time_spent_minutes__sum'] or 0
        }
        return Response({'stats': stats, 'assigned_tickets': TicketSerializer(assigned_tickets, many=True).data, 'recent_logs': WorkLogSerializer(recent_logs, many=True).data})

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class WorkTypeViewSet(viewsets.ModelViewSet):
    queryset = WorkType.objects.all()
    serializer_class = WorkTypeSerializer
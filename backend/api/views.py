from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
import json
from .models import (Project, ProjectStage, Tag, Ticket, TicketComment, WorkType, WorkLog, TimeTrack, 
                     TicketNote, TicketHistory, TicketAttachment, Notification, CompanyEvent, EventLabel, 
                     Skill, ProfileSkill)
from .serializers import *

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    def get_queryset(self):
        queryset = super().get_queryset()
        if project_id := self.request.query_params.get('project'): queryset = queryset.filter(project_id=project_id)
        if assignee_id := self.request.query_params.get('assignee'): queryset = queryset.filter(assignee_id=assignee_id)
        return queryset

    @action(detail=True, methods=['post'])
    def start_timer(self, request, pk=None):
        ticket = self.get_object()
        if TimeTrack.objects.filter(user=request.user, end_time__isnull=True).exists():
            return Response({'error': 'You already have an active timer.'}, status=status.HTTP_400_BAD_REQUEST)
        TimeTrack.objects.create(user=request.user, ticket=ticket, work_type_id=request.data.get('work_type'))
        return Response({'status': 'started'})

    def perform_create(self, serializer):
        ticket = serializer.save(creator=self.request.user)
        if ticket.assignee and ticket.assignee != self.request.user:
            Notification.objects.create(user=ticket.assignee, message=f"На вас назначена новая задача #{ticket.id}: {ticket.title}", link=f"/tickets/{ticket.id}")

    @action(detail=True, methods=['post'])
    def stop_timer(self, request, pk=None):
        ticket = self.get_object()
        active_track = TimeTrack.objects.filter(user=request.user, ticket=ticket, end_time__isnull=True).first()
        if not active_track: return Response({'error': 'No active timer for this ticket.'}, status=status.HTTP_400_BAD_REQUEST)
        active_track.end_time = timezone.now()
        active_track.save()
        minutes = int((active_track.end_time - active_track.start_time).total_seconds() / 60)
        if minutes > 0: WorkLog.objects.create(ticket=ticket, user=request.user, work_type=active_track.work_type, time_spent_minutes=minutes, comment="Автоматический трекинг")
        return Response({'status': 'stopped', 'duration_minutes': minutes})

    def perform_update(self, serializer):
        old_instance = self.get_object()
        updated_instance = serializer.save()
        changes = []
        if old_instance.status != updated_instance.status: changes.append(f"статус с '{old_instance.get_status_display()}' на '{updated_instance.get_status_display()}'")
        if old_instance.priority != updated_instance.priority: changes.append(f"приоритет с '{old_instance.get_priority_display()}' на '{updated_instance.get_priority_display()}'")
        if changes: TicketHistory.objects.create(ticket=updated_instance, user=self.request.user, action="Изменил " + ", ".join(changes))
        if old_instance.assignee != updated_instance.assignee and updated_instance.assignee:
            Notification.objects.create(user=updated_instance.assignee, message=f"На вас переназначена задача #{updated_instance.id}: {updated_instance.title}", link=f"/tickets/{updated_instance.id}")

class TicketCommentViewSet(viewsets.ModelViewSet):
    queryset = TicketComment.objects.all()
    serializer_class = TicketCommentSerializer
    def perform_create(self, serializer):
        comment = serializer.save(author=self.request.user)
        ticket = comment.ticket
        if ticket.assignee and ticket.assignee != self.request.user:
            Notification.objects.create(user=ticket.assignee, message=f"Новый комментарий в задаче #{ticket.id} от {self.request.user.username}", link=f"/tickets/{ticket.id}")

class TicketNoteViewSet(viewsets.ModelViewSet):
    queryset = TicketNote.objects.all()
    serializer_class = TicketNoteSerializer
    def perform_create(self, serializer): serializer.save(author=self.request.user)

class TicketAttachmentViewSet(viewsets.ModelViewSet):
    queryset = TicketAttachment.objects.all()
    serializer_class = TicketAttachmentSerializer
    def perform_create(self, serializer): serializer.save(user=self.request.user)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    def get_queryset(self): return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'ok'})

class EventLabelViewSet(viewsets.ModelViewSet):
    queryset = EventLabel.objects.all()
    serializer_class = EventLabelSerializer

class CompanyEventViewSet(viewsets.ModelViewSet):
    queryset = CompanyEvent.objects.all().order_by('-created_at')
    serializer_class = CompanyEventSerializer
    def perform_create(self, serializer): serializer.save(author=self.request.user)

class WorkLogViewSet(viewsets.ModelViewSet):
    queryset = WorkLog.objects.all()
    serializer_class = WorkLogSerializer
    def perform_create(self, serializer): serializer.save(user=self.request.user)

class SkillViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer

class DashboardView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    def list(self, request):
        user = request.user
        today = timezone.now().date()
        month_start = today.replace(day=1)
        active_statuses = ['OPEN', 'IN_PROGRESS', 'REVIEW']

        my_tickets = Ticket.objects.filter(assignee=user, status__in=active_statuses).order_by('-created_at')
        my_recent_logs = WorkLog.objects.filter(user=user).order_by('-created_at')[:10]
        
        my_worked_today = WorkLog.objects.filter(user=user, created_at__date=today).aggregate(Sum('time_spent_minutes'))['time_spent_minutes__sum'] or 0
        total_worked_today = WorkLog.objects.filter(created_at__date=today).aggregate(Sum('time_spent_minutes'))['time_spent_minutes__sum'] or 0
        
        my_completed_month = Ticket.objects.filter(assignee=user, status='DONE', updated_at__date__gte=month_start).count()
        total_completed_month = Ticket.objects.filter(status='DONE', updated_at__date__gte=month_start).count()

        stats = {
            'my_assigned_count': my_tickets.count(),
            'total_assigned_count': Ticket.objects.filter(status__in=active_statuses).count(),
            'my_worked_minutes_today': my_worked_today,
            'total_worked_minutes_today': total_worked_today,
            'my_completed_tasks_month': my_completed_month,
            'total_completed_tasks_month': total_completed_month,
            'total_projects': Project.objects.filter(status='ACTIVE').count(),
        }
        
        return Response({'stats': stats, 'assigned_tickets': TicketSerializer(my_tickets, many=True).data, 'recent_logs': WorkLogSerializer(my_recent_logs, many=True).data})

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=False, methods=['get', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        user = request.user
        if request.method == 'PATCH':
            # Сохраняем системный email
            if 'email' in request.data: user.email = request.data['email']
            
            # Сохраняем ссылки и телефон
            if 'phone_number' in request.data: user.profile.phone_number = request.data['phone_number']
            if 'tg_link' in request.data: user.profile.tg_link = request.data['tg_link']
            if 'tg_channel_link' in request.data: user.profile.tg_channel_link = request.data['tg_channel_link']
            if 'gitlab_link' in request.data: user.profile.gitlab_link = request.data['gitlab_link']
            if 'github_link' in request.data: user.profile.github_link = request.data['github_link']
            
            if 'avatar' in request.FILES:
                user.profile.avatar = request.FILES['avatar']
            
            user.profile.save()
            user.save()
            
            if 'skills' in request.data:
                try:
                    skills_data = json.loads(request.data['skills'])
                    user.profile.skills.all().delete()
                    for s in skills_data:
                        ProfileSkill.objects.create(profile=user.profile, skill_id=s['skill_id'], level=s['level'])
                except Exception as e:
                    print("Ошибка сохранения навыков:", e)

        serializer = self.get_serializer(user)
        return Response(serializer.data)

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class WorkTypeViewSet(viewsets.ModelViewSet):
    queryset = WorkType.objects.all()
    serializer_class = WorkTypeSerializer
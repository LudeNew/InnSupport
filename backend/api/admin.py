from django.contrib import admin
from .models import (
    Department, Profile, Project, ProjectStage, Tag, 
    Ticket, TicketComment, WorkType, WorkLog, TimeTrack, 
    TicketNote, TicketHistory, TicketAttachment, Notification
)

# Базовые регистрации
admin.site.register(Department)
admin.site.register(Tag)
admin.site.register(ProjectStage)
admin.site.register(TicketComment)
admin.site.register(TicketNote)
admin.site.register(TicketAttachment)
admin.site.register(Notification)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'department')
    list_filter = ('role', 'department')
    search_fields = ('user__username', 'user__email')

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'project_type', 'created_at')
    list_filter = ('status', 'project_type')
    search_fields = ('name',)
    filter_horizontal = ('leads',)

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'project', 'status', 'priority', 'assignee')
    list_filter = ('status', 'priority', 'project')
    search_fields = ('title', 'description')

@admin.register(WorkType)
class WorkTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent')
    list_filter = ('parent',)

@admin.register(WorkLog)
class WorkLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'ticket', 'work_type', 'time_spent_minutes', 'created_at')
    list_filter = ('user', 'work_type', 'created_at')

@admin.register(TimeTrack)
class TimeTrackAdmin(admin.ModelAdmin):
    list_display = ('user', 'ticket', 'start_time', 'end_time', 'work_type')
    list_filter = ('user', 'end_time')

@admin.register(TicketHistory)
class TicketHistoryAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'user', 'action', 'created_at')
    list_filter = ('created_at', 'user')
    search_fields = ('action', 'ticket__title')
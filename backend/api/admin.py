from django.contrib import admin
from .models import (
    Department, Profile, Project, ProjectStage, Tag, 
    Ticket, TicketComment, WorkType, WorkLog, TimeTrack, 
    TicketNote, TicketHistory, TicketAttachment, Notification, CompanyEvent, EventLabel, Skill, ProfileSkill
)

# Базовые регистрации
admin.site.register(Department)
admin.site.register(Tag)
admin.site.register(ProjectStage)
admin.site.register(TicketComment)
admin.site.register(TicketNote)
admin.site.register(TicketAttachment)
admin.site.register(Notification)
admin.site.register(CompanyEvent)
admin.site.register(EventLabel)
admin.site.register(Skill)

class ProfileSkillInline(admin.TabularInline):
    model = ProfileSkill
    extra = 1

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'department')
    list_filter = ('role', 'department')
    filter_horizontal = ('involved_projects',) # Удобный выбор вовлеченных проектов
    inlines = [ProfileSkillInline] # Удобное добавление навыков

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'project_type', 'created_at')
    filter_horizontal = ('leads',)

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'project', 'status', 'priority', 'assignee')
    list_filter = ('status', 'priority', 'project')

@admin.register(WorkType)
class WorkTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent')

@admin.register(WorkLog)
class WorkLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'ticket', 'work_type', 'time_spent_minutes', 'created_at')

@admin.register(TimeTrack)
class TimeTrackAdmin(admin.ModelAdmin):
    list_display = ('user', 'ticket', 'start_time', 'end_time', 'work_type')

@admin.register(TicketHistory)
class TicketHistoryAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'user', 'action', 'created_at')
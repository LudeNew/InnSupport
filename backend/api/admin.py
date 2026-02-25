from django.contrib import admin
from .models import (Department, Profile, ProfileDepartment, Project, ProjectStage, ProjectRelease, Tag, Ticket, 
                     TicketComment, WorkType, WorkLog, TimeTrack, TicketNote, 
                     TicketHistory, TicketAttachment, CompanyEvent, EventLabel, Skill, ProfileSkill)

# ==========================================
# ИНЛАЙНЫ ДЛЯ ПРОФИЛЯ
# ==========================================
class ProfileSkillInline(admin.TabularInline):
    model = ProfileSkill
    extra = 1
    classes = ['collapse']

class ProfileDepartmentInline(admin.TabularInline):
    model = ProfileDepartment
    extra = 1
    classes = ['collapse']

# ==========================================
# ИНЛАЙНЫ ДЛЯ ЗАДАЧИ
# ==========================================
class TicketCommentInline(admin.TabularInline):
    model = TicketComment
    extra = 1
    classes = ['collapse']

class TicketNoteInline(admin.TabularInline):
    model = TicketNote
    extra = 1
    classes = ['collapse']

class WorkLogInline(admin.TabularInline):
    model = WorkLog
    extra = 0
    classes = ['collapse']

class TicketAttachmentInline(admin.TabularInline):
    model = TicketAttachment
    extra = 0
    classes = ['collapse']

class TicketHistoryInline(admin.TabularInline):
    model = TicketHistory
    extra = 0
    readonly_fields = ('user', 'action', 'created_at')
    can_delete = False
    classes = ['collapse']

# ==========================================
# ОСНОВНЫЕ РЕГИСТРАЦИИ
# ==========================================
admin.site.register(Department)
admin.site.register(Tag)
admin.site.register(ProjectStage)
admin.site.register(EventLabel)
admin.site.register(Skill)
admin.site.register(WorkType)
admin.site.register(TimeTrack)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email')
    # ВОТ ЭТО ТОЖЕ ВАЖНО - Убираем filter_horizontal, используем inlines
    inlines = [ProfileDepartmentInline, ProfileSkillInline]

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'project_type', 'created_at')
    list_filter = ('status', 'project_type')
    search_fields = ('name',)
    filter_horizontal = ('leads', 'participants')

@admin.register(ProjectRelease)
class ProjectReleaseAdmin(admin.ModelAdmin):
    list_display = ('name', 'version', 'project', 'status', 'release_date')
    list_filter = ('status', 'project')
    filter_horizontal = ('stages',)

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'project', 'status', 'priority', 'assignee')
    list_filter = ('status', 'priority', 'project')
    search_fields = ('title', 'description')
    
    inlines = [
        WorkLogInline,
        TicketCommentInline,
        TicketNoteInline,
        TicketAttachmentInline,
        TicketHistoryInline
    ]

@admin.register(CompanyEvent)
class CompanyEventAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'date', 'label')
    list_filter = ('date', 'label')
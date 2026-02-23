from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Department(models.Model):
    name = models.CharField(max_length=100)
    icon_name = models.CharField(max_length=50, blank=True)
    def __str__(self): return self.name

class Skill(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self): return self.name

class Profile(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Администратор'),
        ('GENERAL_MANAGER', 'Главный менеджер'),
        ('MANAGER', 'Менеджер'),
        ('DEVELOPER', 'Разработчик'),
        ('EXECUTOR', 'Исполнитель'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='EXECUTOR')
    involved_projects = models.ManyToManyField('Project', related_name='involved_profiles', blank=True)
    
    phone_number = models.CharField(max_length=20, blank=True) # НОВОЕ ПОЛЕ
    tg_link = models.CharField(max_length=255, blank=True)
    tg_channel_link = models.CharField(max_length=255, blank=True)
    gitlab_link = models.CharField(max_length=255, blank=True)
    github_link = models.CharField(max_length=255, blank=True)

    def __str__(self): return self.user.username

class ProfileSkill(models.Model):
    LEVELS = [('BASE', 'Базовый'), ('ADVANCED', 'Продвинутый'), ('EXPERT', 'Высший')]
    profile = models.ForeignKey(Profile, related_name='skills', on_delete=models.CASCADE)
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    level = models.CharField(max_length=20, choices=LEVELS, default='BASE')

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created: Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

class Project(models.Model):
    STATUS_CHOICES = [('ACTIVE', 'Active'), ('ARCHIVED', 'Archived'), ('CLOSED', 'Closed')]
    TYPE_CHOICES = [('INTERNAL', 'Internal'), ('EXTERNAL', 'External')]
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    project_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='INTERNAL')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    leads = models.ManyToManyField(User, related_name='led_projects', blank=True)
    def __str__(self): return self.name

class ProjectStage(models.Model):
    project = models.ForeignKey(Project, related_name='stages', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)
    class Meta: ordering = ['order']
    def __str__(self): return f"{self.project.name} - {self.name}"

class Tag(models.Model):
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=20, default='#3b82f6')
    def __str__(self): return self.name

class Ticket(models.Model):
    PRIORITY_CHOICES = [('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High'), ('CRITICAL', 'Critical')]
    STATUS_CHOICES = [('OPEN', 'Open'), ('IN_PROGRESS', 'In Progress'), ('REVIEW', 'Review'), ('DONE', 'Done')]
    project = models.ForeignKey(Project, related_name='tickets', on_delete=models.CASCADE)
    stage = models.ForeignKey(ProjectStage, related_name='tickets', on_delete=models.SET_NULL, null=True, blank=True)
    assignee = models.ForeignKey(User, related_name='assigned_tickets', on_delete=models.SET_NULL, null=True, blank=True)
    creator = models.ForeignKey(User, related_name='created_tickets', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    tags = models.ManyToManyField(Tag, blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return f"#{self.id} {self.title}"

class TicketComment(models.Model):
    ticket = models.ForeignKey(Ticket, related_name='comments', on_delete=models.CASCADE)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class TicketNote(models.Model):
    ticket = models.ForeignKey(Ticket, related_name='notes', on_delete=models.CASCADE)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class TicketHistory(models.Model):
    ticket = models.ForeignKey(Ticket, related_name='history', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

class WorkType(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='subtypes', on_delete=models.CASCADE)
    def __str__(self): return f"{self.parent.name} -> {self.name}" if self.parent else self.name

class WorkLog(models.Model):
    ticket = models.ForeignKey(Ticket, related_name='worklogs', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='worklogs', on_delete=models.CASCADE)
    work_type = models.ForeignKey(WorkType, on_delete=models.SET_NULL, null=True)
    time_spent_minutes = models.PositiveIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class TimeTrack(models.Model):
    ticket = models.ForeignKey(Ticket, related_name='active_tracks', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='active_tracks', on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    work_type = models.ForeignKey(WorkType, on_delete=models.SET_NULL, null=True, blank=True)

class TicketAttachment(models.Model):
    ticket = models.ForeignKey(Ticket, related_name='attachments', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to='attachments/%Y/%m/%d/')
    file_name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Notification(models.Model):
    user = models.ForeignKey(User, related_name='notifications', on_delete=models.CASCADE)
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

# НОВЫЕ МОДЕЛИ ДЛЯ СОБЫТИЙ
class EventLabel(models.Model):
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=20, default='#3b82f6')
    def __str__(self): return self.name

class CompanyEvent(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    label = models.ForeignKey(EventLabel, on_delete=models.SET_NULL, null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.title
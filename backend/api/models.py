from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Department(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self): return self.name

class Skill(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self): return self.name

class ProfileDepartment(models.Model):
    LEVEL_CHOICES = [
        ('MAIN', 'Main'),
        ('MASTER', 'Master'),
        ('BASIC', 'Basic'),
    ]
    profile = models.ForeignKey('Profile', related_name='department_links', on_delete=models.CASCADE)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='BASIC')

    class Meta:
        unique_together = ('profile', 'department')

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
    
    departments = models.ManyToManyField(Department, through='ProfileDepartment', blank=True)
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='EXECUTOR')
    tg_link = models.URLField(max_length=200, blank=True, null=True)
    tg_channel_link = models.URLField(max_length=200, blank=True, null=True)
    gitlab_link = models.URLField(max_length=200, blank=True, null=True)
    github_link = models.URLField(max_length=200, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self): return f"Профиль {self.user.username}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created: Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

class ProfileSkill(models.Model):
    LEVEL_CHOICES = [('BASIC', 'Базовый'), ('ADVANCED', 'Продвинутый'), ('EXPERT', 'Высший')]
    profile = models.ForeignKey(Profile, related_name='skills', on_delete=models.CASCADE)
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='BASIC')
    class Meta: unique_together = ('profile', 'skill')

class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=50, choices=[('ACTIVE', 'Активен'), ('CLOSED', 'Закрыт')], default='ACTIVE')
    project_type = models.CharField(max_length=50, choices=[('INTERNAL', 'Внутренний'), ('EXTERNAL', 'Внешний')], default='INTERNAL')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    leads = models.ManyToManyField(User, related_name='led_projects', blank=True)
    participants = models.ManyToManyField(Profile, related_name='involved_projects', blank=True)
    website_link = models.URLField(max_length=200, blank=True, null=True)
    gitlab_link = models.URLField(max_length=200, blank=True, null=True)
    figma_link = models.URLField(max_length=200, blank=True, null=True)
    def __str__(self): return self.name

class ProjectStage(models.Model):
    project = models.ForeignKey(Project, related_name='stages', on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=50, choices=[('ACTIVE', 'Активен'), ('CLOSED', 'Закрыт')], default='ACTIVE')
    icon = models.CharField(max_length=50, blank=True)
    priority = models.CharField(max_length=20, choices=[('LOW', 'Низкий'), ('MEDIUM', 'Средний'), ('HIGH', 'Высокий'), ('CRITICAL', 'Критический')], default='MEDIUM')
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f"{self.project.name} - {self.name}"

class ProjectRelease(models.Model):
    STATUS_CHOICES = [('DRAFT', 'В планах'), ('PUBLISHED', 'Выпущен')]
    project = models.ForeignKey(Project, related_name='releases', on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    version = models.CharField(max_length=50)
    release_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    stages = models.ManyToManyField(ProjectStage, related_name='releases', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f"{self.name} (v{self.version})"

class Tag(models.Model):
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=20, default="#e5e7eb")
    def __str__(self): return self.name

class Ticket(models.Model):
    project = models.ForeignKey(Project, related_name='tickets', on_delete=models.CASCADE)
    stage = models.ForeignKey(ProjectStage, related_name='tickets', on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=50, choices=[('OPEN', 'Открыто'), ('IN_PROGRESS', 'В работе'), ('REVIEW', 'На проверке'), ('DONE', 'Готово')], default='OPEN')
    priority = models.CharField(max_length=50, choices=[('LOW', 'Низкий'), ('MEDIUM', 'Средний'), ('HIGH', 'Высокий'), ('CRITICAL', 'Критический')], default='MEDIUM')
    creator = models.ForeignKey(User, related_name='created_tickets', on_delete=models.CASCADE)
    assignee = models.ForeignKey(User, related_name='assigned_tickets', on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return self.title

class TicketComment(models.Model):
    ticket = models.ForeignKey(Ticket, related_name='comments', on_delete=models.CASCADE)
    author = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class TicketNote(models.Model):
    ticket = models.ForeignKey(Ticket, related_name='notes', on_delete=models.CASCADE)
    author = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class TicketHistory(models.Model):
    ticket = models.ForeignKey(Ticket, related_name='history', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    action = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

class TicketAttachment(models.Model):
    ticket = models.ForeignKey(Ticket, related_name='attachments', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    file = models.FileField(upload_to='attachments/')
    filename = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def save(self, *args, **kwargs):
        if self.file and not self.filename: self.filename = self.file.name
        super().save(*args, **kwargs)

class Notification(models.Model):
    user = models.ForeignKey(User, related_name='notifications', on_delete=models.CASCADE, null=True, blank=True)
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class EventLabel(models.Model):
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=20, default="#e5e7eb")
    def __str__(self): return self.name

class CompanyEvent(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    date = models.DateField(auto_now_add=True, null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    label = models.ForeignKey(EventLabel, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class WorkType(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtypes')
    def __str__(self): return f"{self.parent.name} - {self.name}" if self.parent else self.name

class WorkLog(models.Model):
    ticket = models.ForeignKey(Ticket, related_name='worklogs', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    work_type = models.ForeignKey(WorkType, on_delete=models.SET_NULL, null=True)
    time_spent_minutes = models.IntegerField()
    time_spent_seconds = models.IntegerField(default=0)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class TimeTrack(models.Model):
    ticket = models.ForeignKey(Ticket, related_name='active_tracks', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='active_tracks', on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    work_type = models.ForeignKey(WorkType, on_delete=models.SET_NULL, null=True, blank=True)
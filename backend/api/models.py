
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# 1. Profile / Users
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True)
    
    def __str__(self):
        return self.user.username

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

# 2. Projects
class Project(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('ARCHIVED', 'Archived'),
        ('CLOSED', 'Closed'),
    ]
    TYPE_CHOICES = [
        ('INTERNAL', 'Internal'),
        ('EXTERNAL', 'External'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    project_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='INTERNAL') # Renamed from type to avoid conflict
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class ProjectStage(models.Model):
    project = models.ForeignKey(Project, related_name='stages', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order']
        
    def __str__(self):
        return f"{self.project.name} - {self.name}"

# 3. Tags
class Tag(models.Model):
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=20, default='#3b82f6') # Hex color
    
    def __str__(self):
        return self.name

# 4. Tickets
class Ticket(models.Model):
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('REVIEW', 'Review'),
        ('DONE', 'Done'),
    ]
    
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

    def __str__(self):
        return f"#{self.id} {self.title}"

# 5. Work Logging & Time Tracking
class WorkType(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='subtypes', on_delete=models.CASCADE)
    
    def __str__(self):
        if self.parent:
            return f"{self.parent.name} -> {self.name}"
        return self.name

class WorkLog(models.Model):
    ticket = models.ForeignKey(Ticket, related_name='worklogs', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='worklogs', on_delete=models.CASCADE)
    work_type = models.ForeignKey(WorkType, on_delete=models.SET_NULL, null=True)
    
    time_spent_minutes = models.PositiveIntegerField() # Time in minutes
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user} - {self.time_spent_minutes}m on {self.ticket}"

class TimeTrack(models.Model):
    ticket = models.ForeignKey(Ticket, related_name='active_tracks', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='active_tracks', on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user} tracking {self.ticket}"

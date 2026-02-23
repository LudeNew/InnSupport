from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (Department, Profile, Project, ProjectStage, Tag, Ticket, TicketComment, WorkType, 
                     WorkLog, TimeTrack, TicketNote, TicketHistory, TicketAttachment, Notification, 
                     CompanyEvent, EventLabel, Skill, ProfileSkill)

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta: model = Department; fields = '__all__'

class SkillSerializer(serializers.ModelSerializer):
    class Meta: model = Skill; fields = '__all__'

class ProfileSkillSerializer(serializers.ModelSerializer):
    skill_details = SkillSerializer(source='skill', read_only=True)
    class Meta: model = ProfileSkill; fields = ['id', 'skill', 'skill_details', 'level']

class ProjectStageSerializer(serializers.ModelSerializer):
    class Meta: model = ProjectStage; fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    stages = ProjectStageSerializer(many=True, read_only=True)
    class Meta: model = Project; fields = '__all__'

class ProfileSerializer(serializers.ModelSerializer):
    department_details = DepartmentSerializer(source='department', read_only=True)
    skills = ProfileSkillSerializer(many=True, read_only=True)
    involved_projects_details = ProjectSerializer(source='involved_projects', many=True, read_only=True)
    class Meta: 
        model = Profile; 
        fields = ['avatar', 'bio', 'department', 'department_details', 'role', 'skills', 'involved_projects', 'involved_projects_details', 'tg_link', 'tg_channel_link', 'gitlab_link', 'github_link', 'phone_number']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    led_projects = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    class Meta: model = User; fields = ['id', 'username', 'first_name', 'last_name', 'email', 'profile', 'led_projects']

class TagSerializer(serializers.ModelSerializer):
    class Meta: model = Tag; fields = '__all__'

class TicketCommentSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    class Meta: model = TicketComment; fields = '__all__'; read_only_fields = ['author']

class TicketNoteSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    class Meta: model = TicketNote; fields = '__all__'; read_only_fields = ['author']

class TicketHistorySerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    class Meta: model = TicketHistory; fields = '__all__'

class TicketAttachmentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    class Meta: model = TicketAttachment; fields = '__all__'; read_only_fields = ['user']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta: model = Notification; fields = '__all__'

class EventLabelSerializer(serializers.ModelSerializer):
    class Meta: model = EventLabel; fields = '__all__'

class CompanyEventSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    label_details = EventLabelSerializer(source='label', read_only=True)
    class Meta: model = CompanyEvent; fields = '__all__'; read_only_fields = ['author']

class WorkTypeSerializer(serializers.ModelSerializer):
    class Meta: model = WorkType; fields = '__all__'

class WorkLogSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    work_type_details = WorkTypeSerializer(source='work_type', read_only=True)
    class Meta: model = WorkLog; fields = '__all__'

class TicketSerializer(serializers.ModelSerializer):
    assignee_details = UserSerializer(source='assignee', read_only=True)
    creator_details = UserSerializer(source='creator', read_only=True)
    project_details = ProjectSerializer(source='project', read_only=True)
    tags_details = TagSerializer(source='tags', many=True, read_only=True)
    stage_details = ProjectStageSerializer(source='stage', read_only=True)
    comments_details = TicketCommentSerializer(source='comments', many=True, read_only=True)
    notes_details = TicketNoteSerializer(source='notes', many=True, read_only=True)
    history_details = TicketHistorySerializer(source='history', many=True, read_only=True)
    worklogs_details = WorkLogSerializer(source='worklogs', many=True, read_only=True) 
    attachments_details = TicketAttachmentSerializer(source='attachments', many=True, read_only=True)
    
    active_timer = serializers.SerializerMethodField()
    class Meta: model = Ticket; fields = '__all__'; read_only_fields = ['creator']

    def get_active_timer(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            active_track = obj.active_tracks.filter(user=request.user, end_time__isnull=True).first()
            if active_track: return {'id': active_track.id, 'start_time': active_track.start_time, 'work_type': active_track.work_type_id}
        return None

class TimeTrackSerializer(serializers.ModelSerializer):
    class Meta: model = TimeTrack; fields = '__all__'
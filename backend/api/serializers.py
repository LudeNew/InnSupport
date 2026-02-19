
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Project, ProjectStage, Tag, Ticket, WorkType, WorkLog, TimeTrack

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['avatar', 'bio']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'profile']

class ProjectStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectStage
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    stages = ProjectStageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = '__all__'

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'

class TicketSerializer(serializers.ModelSerializer):
    assignee_details = UserSerializer(source='assignee', read_only=True)
    project_details = ProjectSerializer(source='project', read_only=True)
    tags_details = TagSerializer(source='tags', many=True, read_only=True)
    stage_details = ProjectStageSerializer(source='stage', read_only=True)
    
    active_timer_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ['creator']

    def get_active_timer_id(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Check for active TimeTrack for this user and ticket
            active_track = obj.active_tracks.filter(user=request.user, end_time__isnull=True).first()
            return active_track.id if active_track else None
        return None

class WorkTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkType
        fields = '__all__'

class WorkLogSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    work_type_details = WorkTypeSerializer(source='work_type', read_only=True)
    
    class Meta:
        model = WorkLog
        fields = '__all__'

class TimeTrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeTrack
        fields = '__all__'

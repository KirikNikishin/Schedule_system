from django.urls import path
from .views import (
    ProgramListView, DepartmentListView, SubjectListView, TeacherListView,
    TypeLessonListView, LessonListView, BuildingListView, AuditoriumListView, GroupListView, GroupCreateView,
    GroupDeleteView, ScheduleListView, ScheduleCreateView, ScheduleUpdateView, TimeListView, TimeCreateView,
    TimeUpdateView, TimeDeleteView, SettingsListView, SettingsCreateView, SettingsUpdateView, SettingsDeleteView,
    FileUploadView, ScheduleFaceAPIView, ScheduleDistAPIView, IntentAPIView, LoadAuditoriumsAPIView,
    LoadTimeAPIView, LoadScheduleAPIView, LoadSubjectsAPIView, schedule_download_view
)


urlpatterns = [
    path('programs/', ProgramListView.as_view(), name='program_list'),
    path('departments/', DepartmentListView.as_view(), name='department_list'),
    path('subjects/', SubjectListView.as_view(), name='subject_list'),
    path('teachers/', TeacherListView.as_view(), name='teacher_list'),
    path('typelessons/', TypeLessonListView.as_view(), name='typelesson_list'),
    path('lessons/', LessonListView.as_view(), name='lesson_list'),
    path('buildings/', BuildingListView.as_view(), name='building_list'),
    path('auditoriums/', AuditoriumListView.as_view(), name='auditorium_list'),
    path('groups/', GroupListView.as_view(), name='group_list'),
    path('groups/create/', GroupCreateView.as_view(), name='group_create'),
    path('groups/delete/<int:pk>/', GroupDeleteView.as_view(), name='group_delete'),
    path('schedules/', ScheduleListView.as_view(), name='schedule_list'),
    path('schedules/create/', ScheduleCreateView.as_view(), name='schedule_create'),
    path('schedules/update/<int:pk>/', ScheduleUpdateView.as_view(), name='schedule_update'),
    path('times/', TimeListView.as_view(), name='time_list'),
    path('times/create/', TimeCreateView.as_view(), name='time_create'),
    path('times/update/<int:pk>/', TimeUpdateView.as_view(), name='time_update'),
    path('times/delete/<int:pk>/', TimeDeleteView.as_view(), name='time_delete'),
    path('settings/', SettingsListView.as_view(), name='settings_list'),
    path('settings/create/', SettingsCreateView.as_view(), name='settings_create'),
    path('settings/update/<int:pk>/', SettingsUpdateView.as_view(), name='settings_update'),
    path('settings/delete/<int:pk>/', SettingsDeleteView.as_view(), name='settings_delete'),
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('schedule-logic-face-to-face/', ScheduleFaceAPIView.as_view(), name='generate-schedule-face-to-face'),
    path('schedule-logic-distance/', ScheduleDistAPIView.as_view(), name='generate-schedule-distance'),
    path('intent/', IntentAPIView.as_view(), name='predict-intent'),
    path('load-auditoriums/', LoadAuditoriumsAPIView.as_view(), name='load-auditoriums'),
    path('load-time/', LoadTimeAPIView.as_view(), name='load-time'),
    path('load-schedule/', LoadScheduleAPIView.as_view(), name='load-schedule'),
    path('load-subjects/', LoadSubjectsAPIView.as_view(), name='load-subjects'),
    path("schedule/download/<str:group_code>/", schedule_download_view, name="schedule_download"),
]

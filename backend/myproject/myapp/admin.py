from django.contrib import admin
from .models import (Program, Department, Subject, Teacher, TypeLesson, Lesson, Building, Auditorium, Group, Schedule,
                     UploadedFile)


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ('code',)
    search_fields = ('code',)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('department_code',)
    search_fields = ('department_code',)


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'program', 'department_code')
    list_filter = ('program', 'department_code')
    search_fields = ('name',)


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('department_code', 'subject', 'name')
    list_filter = ('department_code', 'subject')
    search_fields = ('name',)


@admin.register(TypeLesson)
class TypeLessonAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('lesson_type', 'subject', 'number', 'teachers')
    list_filter = ('lesson_type', 'subject__program')
    search_fields = ('subject__name', 'teachers')


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Auditorium)
class AuditoriumAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'size', 'department_code', 'building')
    list_filter = ('department_code', 'building')
    search_fields = ('name', 'type', 'size')


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('program', 'number', 'year')
    list_filter = ('program', )
    search_fields = ('number', 'year', )


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ('group', 'date', 'day_of_week', 'time', 'subject', 'type_lesson', 'teacher', 'auditorium', 'building', )
    search_fields = ('group', 'date', 'day_of_week', 'time', 'subject', 'type_lesson', 'teacher', 'auditorium', 'building', )


admin.site.register(UploadedFile)


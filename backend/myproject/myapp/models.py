# models.py

from django.db import models

class Program(models.Model):
    code = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.code

class Department(models.Model):
    department_code = models.PositiveIntegerField(unique=True)

    def __str__(self):
        return str(self.department_code)


class Subject(models.Model):
    name = models.CharField(max_length=100)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='subjects')
    department_code = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='subjects')
    semester = models.PositiveSmallIntegerField(default=1)

    def __str__(self):
        return f"{self.name} ({self.program.code})"


class Teacher(models.Model):
    department_code = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='teachers')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='teachers')
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.subject.name} ({self.department_code.department_code}))"

class TypeLesson(models.Model):
    name = models.CharField(max_length=100, unique=True)  # Например: Лекция, Семинар

    def __str__(self):
        return self.name


class Lesson(models.Model):

    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='lessons')
    number = models.PositiveIntegerField()
    teachers = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='lessons', null=True)
    lesson_type = models.ForeignKey(TypeLesson, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.lesson_type} {self.subject.name} ({self.number} занятий)"

class Building(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Auditorium(models.Model):
    TYPE_CHOICES = [
        ("Lection", "Lection"),
        ("Seminar", "Seminar"),
        ("Laboratory", "Laboratory"),
        ("Sport", "Sport"),
    ]

    SIZE_CHOICES = [
        ("big", "Big"),
        ("small", "Small"),
        ("", "Unknown")
    ]

    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    size = models.CharField(max_length=10, choices=SIZE_CHOICES, blank=True)
    department_code = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='auditoriums', null=True, blank=True)
    building = models.ForeignKey(Building, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.name} ({self.building.name})"


class Group(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='group')
    number = models.CharField(max_length=10, unique=True)
    year = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.number} ({self.year}) ({self.program.code})"

class Schedule(models.Model):
    group = models.CharField(max_length=50)
    date = models.CharField(max_length=10)  # формат: "YYYY-MM-DD"
    day_of_week = models.CharField(max_length=20)
    time = models.CharField(max_length=20)
    subject = models.CharField(max_length=100)
    type_lesson = models.CharField(max_length=50)
    teacher = models.CharField(max_length=100)
    auditorium = models.CharField(max_length=20)
    building = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.group} - {self.date} - {self.time} - {self.subject}"


class Time(models.Model):
    time = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.time


class Settings(models.Model):
    semester_type = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    preferences = models.TextField(blank=True)

    def __str__(self):
        return f"{self.semester_type} ({self.start_date} - {self.end_date})"


class UploadedFile(models.Model):
    file = models.FileField(upload_to='uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)


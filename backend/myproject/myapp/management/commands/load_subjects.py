import json
import os
from django.core.management.base import BaseCommand
from django.db import IntegrityError
from myapp.models import Program, Subject, Lesson, TypeLesson, Department, Teacher

class Command(BaseCommand):
    help = 'Загружает предметы из JSON'

    def handle(self, *args, **kwargs):
        Program.objects.all().delete()
        Subject.objects.all().delete()
        Lesson.objects.all().delete()
        TypeLesson.objects.all().delete()
        Department.objects.all().delete()
        Teacher.objects.all().delete()
        self.stdout.write(self.style.WARNING('Предыдущие записи удалены.'))

        from django.conf import settings

        json_path = os.path.join(settings.BASE_DIR, 'media', 'json', 'subjects_filled.json')

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        lesson_types = ['Lection', 'Seminar', 'Lab']
        #print(lesson_types)

        for lesson_type in lesson_types:
            TypeLesson.objects.get_or_create(name=lesson_type)

        count_programs = 0
        count_subjects = 0
        count_lessons = 0

        for program_code, subjects in data.items():
            program, _ = Program.objects.get_or_create(code=program_code)
            count_programs += 1

            for subject_name, lesson_data in subjects.items():
                department_code = lesson_data.get("Department", 0)
                semester = lesson_data.get("Semester", 1)

                department, _ = Department.objects.get_or_create(department_code=department_code)

                subject, _ = Subject.objects.get_or_create(
                    name=subject_name,
                    program=program,
                    defaults={'department_code': department, 'semester': semester}
                )
                subject.department_code = department
                subject.semester = semester
                subject.save()

                for lesson_type_name, lesson_info in lesson_data.items():
                    if lesson_type_name in ("Department", "Semester"):
                        continue

                    type_lesson = TypeLesson.objects.get(name=lesson_type_name)

                    number = lesson_info.get('Number', 0)
                    teacher_name = lesson_info.get('Teacher', '').strip()

                    teacher = None
                    if teacher_name:
                        teacher, _ = Teacher.objects.get_or_create(
                            name=teacher_name,
                            subject=subject,
                            department_code=department
                        )

                    Lesson.objects.update_or_create(
                        subject=subject,
                        lesson_type=type_lesson,
                        defaults={
                            'number': number,
                            'teachers': teacher
                        }
                    )

                    count_lessons += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Импорт завершён: {count_programs} программ, {count_subjects} предметов, {count_lessons} занятий."
            )
        )

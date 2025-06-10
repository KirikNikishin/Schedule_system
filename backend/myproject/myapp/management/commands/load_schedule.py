import json
from django.core.management.base import BaseCommand
from myapp.models import Schedule


class Command(BaseCommand):
    help = 'Импортирует расписание из фиксированного JSON-файла в таблицу Schedule'

    def handle(self, *args, **kwargs):
        json_path = 'media/json/schedule.json'  # <-- Укажи здесь актуальный путь

        try:
            with open(json_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'Ошибка чтения файла: {e}'))
            return

        Schedule.objects.all().delete()
        self.stdout.write(self.style.WARNING('Предыдущие записи удалены.'))

        created_count = 0
        for group, weeks in data.items():
            for date_str, days in weeks.items():
                for day_name, times in days.items():
                    for time_slot, lesson_info in times.items():
                        #print(lesson_info)
                        if not lesson_info:
                            subject, type_lesson, teacher, auditorium, building = "", "", "", "", ""
                        else:
                            subject, type_lesson, teacher, auditorium, building = lesson_info

                        Schedule.objects.create(
                            group=group,
                            date=date_str,
                            day_of_week=day_name,
                            time=time_slot,
                            subject=subject,
                            type_lesson=type_lesson,
                            teacher=teacher,
                            auditorium=auditorium,
                            building=building
                        )
                        created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Успешно импортировано {created_count} записей.'))

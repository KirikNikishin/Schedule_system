# load_auditoriums.py
import json
from django.core.management.base import BaseCommand
from myapp.models import Building, Auditorium, Department

class Command(BaseCommand):
    help = "Load auditoriums from JSON"

    def handle(self, *args, **kwargs):
        with open("media/json/auditoriums.json", "r", encoding="utf-8") as f:
            data = json.load(f)["Buildings"]

        for building_name, content in data.items():
            building, _ = Building.objects.get_or_create(name=building_name)

            # Загрузка аудиторий лекций и спорта
            for type_key in ["Lection_big", "Lection_small", "Sport"]:
                if type_key in content:
                    type_name = "Lection" if "Lection" in type_key else "Sport"
                    size = "big" if "big" in type_key else "small" if "small" in type_key else ""
                    for name in content[type_key]:
                        Auditorium.objects.get_or_create(
                            name=name,
                            type=type_name,
                            size=size,
                            building=building,
                            department_code=None  # лекции и спорт — без кафедры
                        )

            # Загрузка аудиторий семинаров и лабораторных
            for type_key in ["Seminar", "Laboratory"]:
                if type_key in content:
                    for dept_code, names in content[type_key].items():
                        #print(dept_code)
                        department, created = Department.objects.get_or_create(department_code=dept_code)
                        for name in names:
                            Auditorium.objects.get_or_create(
                                name=name,
                                type=type_key,
                                department_code=department,
                                building=building,
                            )

        self.stdout.write(self.style.SUCCESS("Auditoriums successfully loaded."))

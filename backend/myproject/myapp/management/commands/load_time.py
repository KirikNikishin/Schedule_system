from django.core.management.base import BaseCommand
from myapp.models import Time

class Command(BaseCommand):
    help = 'Заполняет таблицу Time фиксированными временными слотами'

    def handle(self, *args, **kwargs):
        Time.objects.all().delete()
        self.stdout.write(self.style.WARNING('Предыдущие записи удалены.'))

        times = [
            "8:30 - 10:10",
            "10:20 - 12:00",
            "12:20 - 14:00",
            "14:10 - 15:50",
            "16:00 - 17:40",
            "18:00 - 19:30",
            "19:40 - 21:10",
            "21:20 - 22:50"
        ]

        created_count = 0
        for t in times:
            _, created = Time.objects.get_or_create(time=t)
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Добавлено {created_count} временных слотов.'))

from rest_framework.generics import ListAPIView
from .models import (Program, Department, Subject, Teacher, TypeLesson, Lesson, Building, Auditorium, Group, Schedule,
                     Time, Settings, UploadedFile)
from .serializers import (
    ProgramSerializer, DepartmentSerializer, SubjectSerializer, TeacherSerializer,
    TypeLessonSerializer, LessonSerializer, BuildingSerializer, AuditoriumSerializer, GroupSerializer, ScheduleSerializer,
    TimeSerializer, SettingsSerializer, UploadedFileSerializer
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.core.files.storage import FileSystemStorage
from .schedule_logic_face_to_face import generate_face_to_face_schedule
from .schedule_logic_distance import generate_distance_schedule
from .intent_model import predict_intent_and_fetch_schedule

from io import StringIO
import os
from django.conf import settings

from django.http import JsonResponse
from django.core.management import call_command
from django.views.decorators.csrf import csrf_exempt
import traceback

from django.shortcuts import render
from django.http import HttpResponse
from django.template.loader import render_to_string


class ProgramListView(ListAPIView):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer


class DepartmentListView(ListAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class SubjectListView(ListAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


class TeacherListView(ListAPIView):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer


class TypeLessonListView(ListAPIView):
    queryset = TypeLesson.objects.all()
    serializer_class = TypeLessonSerializer


class LessonListView(ListAPIView):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer


class BuildingListView(ListAPIView):
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer


class AuditoriumListView(ListAPIView):
    queryset = Auditorium.objects.all()
    serializer_class = AuditoriumSerializer


class GroupListView(ListAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer


class GroupCreateView(APIView):
    @swagger_auto_schema(
        request_body=GroupSerializer,
        responses={201: GroupSerializer},
        operation_description="Создать новую группу. Укажите номер группы и ID существующей программы.",
        examples={
            "application/json": {
                "year": "4",
                "number": "ИДБ-21-11",
                "program": 1
            }
        }
    )
    def post(self, request):
        serializer = GroupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GroupDeleteView(APIView):
    @swagger_auto_schema(
        operation_description="Удаление группы по ID",
        responses={
            204: "Группа успешно удалена",
            404: "Группа не найдена"
        }
    )
    def delete(self, request, pk):
        try:
            group = Group.objects.get(pk=pk)
            group.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Group.DoesNotExist:
            return Response({"error": "Группа не найдена"}, status=status.HTTP_404_NOT_FOUND)


class ScheduleListView(ListAPIView):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer


class ScheduleCreateView(APIView):
    @swagger_auto_schema(
        request_body=ScheduleSerializer,
        responses={201: ScheduleSerializer},
        operation_description="Создание новой записи расписания"
    )
    def post(self, request):
        serializer = ScheduleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ScheduleUpdateView(APIView):
    @swagger_auto_schema(
        request_body=ScheduleSerializer,
        responses={200: ScheduleSerializer},
        operation_description="Обновление записи расписания по ID"
    )
    def put(self, request, pk):
        try:
            schedule = Schedule.objects.get(pk=pk)
        except Schedule.DoesNotExist:
            return Response({'error': 'Schedule not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ScheduleSerializer(schedule, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TimeListView(APIView):
    @swagger_auto_schema(
        operation_description="Получить все временные слоты",
        responses={200: TimeSerializer(many=True)}
    )
    def get(self, request):
        times = Time.objects.all()
        serializer = TimeSerializer(times, many=True)
        return Response(serializer.data)


class TimeCreateView(APIView):
    @swagger_auto_schema(
        request_body=TimeSerializer,
        responses={201: TimeSerializer},
        operation_description="Создать новый временной слот"
    )
    def post(self, request):
        serializer = TimeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TimeUpdateView(APIView):
    @swagger_auto_schema(
        request_body=TimeSerializer,
        responses={200: TimeSerializer},
        operation_description="Обновить временной слот по ID"
    )
    def put(self, request, pk):
        try:
            time_slot = Time.objects.get(pk=pk)
        except Time.DoesNotExist:
            return Response({'error': 'Time slot not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = TimeSerializer(time_slot, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TimeDeleteView(APIView):
    @swagger_auto_schema(
        operation_description="Удаление позиции времени по ID",
        responses={
            204: "Позиция времени успешно удалена",
            404: "Позиция времени не найдена"
        }
    )
    def delete(self, request, pk):
        try:
            time_slot = Time.objects.get(pk=pk)
            time_slot.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Time.DoesNotExist:
            return Response({"error": "Позиция времени не найдена"}, status=status.HTTP_404_NOT_FOUND)


class SettingsListView(APIView):
    @swagger_auto_schema(
        operation_description="Получить все настройки",
        responses={200: SettingsSerializer(many=True)}
    )
    def get(self, request):
        settings = Settings.objects.all()
        serializer = SettingsSerializer(settings, many=True)
        return Response(serializer.data)


class SettingsCreateView(APIView):
    @swagger_auto_schema(
        request_body=SettingsSerializer,
        responses={201: SettingsSerializer},
        operation_description="Создать новые настройки"
    )
    def post(self, request):
        serializer = SettingsSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SettingsUpdateView(APIView):
    @swagger_auto_schema(
        request_body=SettingsSerializer,
        responses={200: SettingsSerializer},
        operation_description="Обновить настройки по ID"
    )
    def put(self, request, pk):
        try:
            setting = Settings.objects.get(pk=pk)
        except Settings.DoesNotExist:
            return Response({'error': 'Настройки не найдены'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SettingsSerializer(setting, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SettingsDeleteView(APIView):
    @swagger_auto_schema(
        operation_description="Удалить настройки по ID",
        responses={204: 'Удалено', 404: 'Не найдено'}
    )
    def delete(self, request, pk):
        try:
            setting = Settings.objects.get(pk=pk)
            setting.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Settings.DoesNotExist:
            return Response({'error': 'Настройки не найдены'}, status=status.HTTP_404_NOT_FOUND)


class FileUploadView(APIView):
    def post(self, request):
        files = request.FILES.getlist('files')

        media_dir = settings.MEDIA_ROOT
        pdf_dir = os.path.join(media_dir, 'pdf')
        xlsx_dir = os.path.join(media_dir, 'xlsx')
        os.makedirs(pdf_dir, exist_ok=True)
        os.makedirs(xlsx_dir, exist_ok=True)

        pdf_storage = FileSystemStorage(location=pdf_dir)
        xlsx_storage = FileSystemStorage(location=xlsx_dir)

        saved_files = []

        for f in files:
            ext = os.path.splitext(f.name)[1].lower()

            if ext == '.pdf':
                filename = pdf_storage.save(f.name, f)
                saved_files.append(os.path.join('pdf', filename))
            elif ext == '.xlsx':
                filename = xlsx_storage.save(f.name, f)
                saved_files.append(os.path.join('xlsx', filename))
            else:
                # Пропускаем неподдерживаемые файлы
                continue

        return Response({"saved": saved_files}, status=status.HTTP_200_OK)


class ScheduleFaceAPIView(APIView):
    def get(self, request):
        try:
            schedule = generate_face_to_face_schedule()
            return Response(schedule, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ScheduleDistAPIView(APIView):
    def get(self, request):
        try:
            schedule = generate_distance_schedule()
            return Response(schedule, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class IntentAPIView(APIView):
    @swagger_auto_schema(
        operation_description="Определение намерения пользователя на основе поля 'preferences' из настроек и генерация соответствующего расписания",
        responses={200: openapi.Response("Предсказанное намерение и расписание", schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "intent": openapi.Schema(type=openapi.TYPE_STRING),
                "schedule": openapi.Schema(type=openapi.TYPE_OBJECT)
            }
        ))}
    )
    def get(self, request):
        try:
            result = predict_intent_and_fetch_schedule()
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoadAuditoriumsAPIView(APIView):
    @swagger_auto_schema(
        operation_description="Запуск команды Django для загрузки аудиторий из файла JSON",
        responses={200: "Аудитории успешно загружены"}
    )
    def post(self, request):
        try:
            out = StringIO()
            call_command("load_auditoriums", stdout=out)
            output_text = out.getvalue()
            return Response({"message": "Аудитории успешно загружены", "log": output_text}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoadTimeAPIView(APIView):
    @swagger_auto_schema(
        operation_description="Запуск команды Django для загрузки фиксированных временных слотов",
        responses={200: "Временные слоты успешно загружены"}
    )
    def post(self, request):
        try:
            out = StringIO()
            call_command("load_time", stdout=out)
            log_output = out.getvalue()
            return Response({"message": "Временные слоты успешно загружены", "log": log_output}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoadScheduleAPIView(APIView):
    @swagger_auto_schema(
        operation_description="Импорт расписания из JSON-файла в модель Schedule",
        responses={200: "Расписание успешно загружено"}
    )
    def post(self, request):
        try:
            out = StringIO()
            call_command("load_schedule", stdout=out)
            log_output = out.getvalue()
            return Response({
                "message": "Расписание успешно загружено",
                "log": log_output
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoadSubjectsAPIView(APIView):
    @swagger_auto_schema(
        operation_description="Загрузка предметов и занятий из файла subjects_filled.json",
        responses={200: "Предметы успешно загружены"}
    )
    def post(self, request):
        try:
            out = StringIO()
            call_command("load_subjects", stdout=out)
            log = out.getvalue()
            return Response({
                "message": "Предметы успешно загружены",
                "log": log
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoadSubjectsAPIView(APIView):
    def post(self, request):
        try:
            print("[DEBUG] load-subjects вызван с фронтенда!")
            out = StringIO()
            call_command("load_subjects", stdout=out)
            log = out.getvalue()
            print("[DEBUG] Лог команды:\n", log)
            return Response({
                "message": "Предметы успешно загружены",
                "log": log
            }, status=200)
        except Exception as e:
            print("[ERROR]", str(e))
            return Response({"error": str(e)}, status=500)


def schedule_download_view(request, group_code):
    # Пример расписания
    schedule = {
        "Понедельник": [
            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
            {"content": "Реинжиниринг и управление бизнес-процессами. Елисеева Н.В. Лекция. 0207 [12.02-15.04 к.н.] <br> Информационные системы и технологии. Бычков С.Ю. Лекция. 0801. [06.05-13.05 к.н.]", "colspan": 1},
            {"content": "Проектирование информационных систем. Бычкова Н.А. Лекция. 0308. [12.02-29.04 к.н.] <br> Проектирование человеко-машинного взаимодействия. Елисеева Н.В. Лекция. 0411. [06.05-13.05 к.н.]", "colspan": 1},
            {"content": "Машинное обучение и интеллектуальные системы. Ибатулин М.Ю. Лекция. 0806. [12.02-13.05 к.н.]", "colspan": 1},
            {"content": "Геометрическое моделирование и компьютерная графика. Толок А.В. Лекция. 0206. [12.02-13.05 к.н.]", "colspan": 1},
            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
        ],
        "Вторник": [
            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
            {"content": "Прикладная физическая культура. Рожнова С.Г. Физкультура. 328/329 [13.02-28.05 к.н.]", "colspan": 1},
            {"content": "Основы теории надёжности. Петров В.Е. Лекция. 0801. [13.02-16.04 к.н.]", "colspan": 1},
            {"content": "Информационные системы и технологии. Бычков С.Ю. Лекция. 0801. [13.02-30.04 к.н.]", "colspan": 1},
            {"content": "Проектирование человеко-машинного взаимодействия. Елисеева Н.В. Лекция. 0801. [13.02-30.04 к.н.]", "colspan": 1},
            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
        ],
        "Среда": [
            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
            {"content": "Машинное обучение и интеллектуальные системы. Биннятов Р.А. Семинар. 410. [14.02-06.03 к.н.]",
             "colspan": 1},
            {"content": f"Геометрическое моделирование и компьютерная графика. Толок А.В. Лабораторные занятия. (Б). ИГ-2. [21.02-17.04 ч.н.] <br> Реинжиниринг и управление бизнес-процессами. Елисеева Н.В. Лабораторные занятия. (Б). 235(д). [28.02-27.03 ч.н.] <br> Проектирование информационных систем. Бычков С.Ю. Лабораторные занятия. (Б). 216. [10.04-08.05 ч.н.] <hr> Геометрическое моделирование и компьютерная графика. Толок А.В. Лабораторные занятия. (А). ИГ-2. [14.02-10.04 ч.н.] <br> Реинжиниринг и управление бизнес-процессами. Елисеева Н.В. Лабораторные занятия. (А). 235(д). [06.03-03.04 ч.н.] <br> Проектирование информационных систем. Бычков С.Ю. Лабораторные занятия. (А). 216. [17.04-15.05 ч.н.] ", "colspan": 2},
            {"content": "Геометрическое моделирование и компьютерная графика. Толок А.В. Семинар. ИГ-1. [21.02-27.03 ч.н.]",
             "colspan": 1},
            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
        ],
        "Четверг": [
            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
            {"content": "Реинжиниринг и управление бизнес-процессами. Елисеева Н.В. Семинар. 312. [15.02-07.03 к.н.]",
             "colspan": 1},
            {
                "content": "Проектирование информационных систем. Бычкова Н.А. Семинар. 308. [15.02-07.03 к.н.]",
                "colspan": 1},
            {
                "content": f"Машинное обучение и интеллектуальные системы. Биннятов Р.А. Лабораторные занятия. (А). 209. [15.02-28.03 ч.н.] <br> Основы теории надёжности. Петров В.Е. Лабораторные занятия. (А). 211. [07.03-04.04 ч.н.] <hr> Машинное обучение и интеллектуальные системы. Биннятов Р.А. Лабораторные занятия. (Б). 209. [22.02-04.04 ч.н.] <br> Основы теории надёжности. Петров В.Е. Лабораторные занятия. (Б). 211. [14.03-11.04 ч.н.]",
                "colspan": 2},

            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
        ],
        "Пятница": [
            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
            {
                "content": f"Информационные системы и технологии. Бычков С.Ю. Лабораторные занятия. (А). 211. [16.02-12.04 ч.н.] <br> Проектирование человеко-машинного взаимодействия. Елисеева Н.В.. Лабораторные занятия. (А). 214. [22.03-19.04 ч.н., 17.05, 31.05] <hr> Информационные системы и технологии. Бычков С.Ю. Лабораторные занятия. (Б). 211. [22.03-19.04 ч.н., 17.05, 31.05] <br> Проектирование человеко-машинного взаимодействия. Елисеева Н.В.. Лабораторные занятия. (Б). 214. [16.02-12.04 ч.н.]",
                "colspan": 2},
            {"content": f"Информационные системы и технологии. Бычков С.Ю. Семинар. 311. [16.02 - 01.03 к.н., 15.03] <br> Основы теории надёжности. Петров В.Е. Семинар. 311. [22.03-12.04 к.н]",
             "colspan": 1},
            {
                "content": "Проектирование человеко-машинного взаимодействия. Елисеева Н.В. Семинар. 410. [16.02 - 01.03 к.н., 15.03]",
                "colspan": 1},
            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
        ],
        "Суббота": [
            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
            {"content": "", "colspan": 1},
        ],
    }

    context = {
        "group_name": group_code,
        "times": [
            "8:30 - 10:10", "10:20 - 12:00", "12:20 - 14:00", "14:10 - 15:50",
            "16:00 - 17:40", "18:00 - 19:30", "19:40 - 21:10", "21:20 - 22:50"
        ],
        "schedule": schedule,
    }

    html = render_to_string("schedule_template.html", context)
    response = HttpResponse(html, content_type="text/html")
    response["Content-Disposition"] = f'attachment; filename=\"{group_code}.html\"'
    return response

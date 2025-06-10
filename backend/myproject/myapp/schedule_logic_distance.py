from datetime import datetime, timedelta
import requests
import random
import json
from collections import defaultdict

API_BASE = "http://localhost:8000/api"

# === Функции сбора данных с API ===
def load_schedule_settings():
    # Загрузка дат
    settings_url = f"{API_BASE}/settings/"
    settings_resp = requests.get(settings_url)
    if not settings_resp.ok:
        raise Exception("Не удалось загрузить настройки расписания")
    settings = settings_resp.json()
    if not settings:
        raise Exception("Список настроек пуст")

    start_date = datetime.strptime(settings[0]["start_date"], "%Y-%m-%d").date()
    end_date = datetime.strptime(settings[0]["end_date"], "%Y-%m-%d").date()
    semester_type = settings[0]["semester_type"]

    # Загрузка слотов времени
    times_url = f"{API_BASE}/times/"
    times_resp = requests.get(times_url)
    if not times_resp.ok:
        raise Exception("Не удалось загрузить временные слоты")
    time_data = times_resp.json()

    # Преобразование time_slots в словарь: {1: ["8:30", "10:10"], ...}
    time_slots = []
    for entry in time_data:
        time_range = entry["time"]
        time_slots += [time_range]

    return start_date, end_date, time_slots, semester_type


def fetch_json(endpoint):
    response = requests.get(f"{API_BASE}/{endpoint}")
    response.raise_for_status()
    return response.json()


def build_study_plan():
    # Загрузим все данные из API
    lessons = fetch_json("lessons")
    subjects = fetch_json("subjects")
    teachers = fetch_json("teachers")
    typelessons = fetch_json("typelessons")
    programs = fetch_json("programs")
    departments = fetch_json("departments")

    # Словари для быстрого доступа по id
    subjects_dict = {subj['id']: subj for subj in subjects}
    teachers_dict = {t['id']: t['name'] for t in teachers}
    typelessons_dict = {tl['id']: tl['name'] for tl in typelessons}
    programs_dict = {pr['id']: pr['code'] for pr in programs}
    departments_dict = {d['id']: d['department_code'] for d in departments}

    # Временный словарь: program_code -> subject_name -> data
    study_plan = defaultdict(lambda: defaultdict(dict))

    for lesson in lessons:
        subject_id = lesson['subject']
        lesson_type_id = lesson['lesson_type']
        teacher_ids = lesson.get('teachers')  # может быть None или список
        number = lesson['number']

        subject_info = subjects_dict.get(subject_id)
        if not subject_info:
            continue  # Нет данных по предмету — пропускаем

        department_id = subject_info['department_code']
        department_info = departments_dict.get(department_id)
        if not department_info:
            continue
        # Получаем код программы (например "09.03.03.01")
        program_code = programs_dict.get(subject_info['program'], 'unknown_program')

        subject_name = subject_info['name']
        department = department_info
        semester = subject_info['semester']

        lesson_type_name = typelessons_dict.get(lesson_type_id, 'Unknown')

        # Учителя — может быть None, может быть список id или один id
        teacher_names = ""
        if teacher_ids:
            # Если teachers — список, то подставляем имена
            if isinstance(teacher_ids, list):
                for tid in teacher_ids:
                    if tid in teachers_dict:
                        teacher_names = teachers_dict[tid]
            else:
                # Если один id, а не список
                tid = teacher_ids
                if tid in teachers_dict:
                    teacher_names = teachers_dict[tid]
        else:
            teacher_names = ""

        # Если в словаре для этого предмета нет Department — добавим
        if 'Department' not in study_plan[program_code][subject_name]:
            study_plan[program_code][subject_name]['Department'] = department

        study_plan[program_code][subject_name]['Semester'] = semester

        # Добавляем информацию по уроку
        study_plan[program_code][subject_name][lesson_type_name] = {
            'Number': number,
            'Teacher': teacher_names
        }

    return dict(study_plan)


def build_auditoriums_buildings():
    # Получаем все корпуса и аудитории
    buildings = fetch_json("buildings")
    auditoriums = fetch_json("auditoriums")
    departments = fetch_json("departments")

    # Сопоставим id корпуса с его названием
    building_names = {b["id"]: b["name"] for b in buildings}
    departments_codes = {d["id"]: d["department_code"] for d in departments}

    # Инициализируем структуру как вложенный defaultdict
    buildings_dict = defaultdict(lambda: {
        "Lection_big": [],
        "Lection_small": [],
        "Seminar": defaultdict(list),
        "Laboratory": defaultdict(list),
        "Sport": []
    })

    for room in auditoriums:
        name = room["name"]
        rtype = room["type"]
        size = room.get("size")
        department_id = room["department_code"]
        dep_code = str(departments_codes.get(department_id))
        building_id = room["building"]
        building_name = building_names.get(building_id, "Unknown")

        b = buildings_dict[building_name]

        if rtype == "Lection":
            if size == "big":
                b["Lection_big"].append(name)
            elif size == "small":
                b["Lection_small"].append(name)
        elif rtype == "Seminar":
            b["Seminar"][dep_code].append(name)
        elif rtype == "Laboratory":
            b["Laboratory"][dep_code].append(name)
        elif rtype == "Sport":
            b["Sport"].append(name)

    return {"Buildings": dict(buildings_dict)}


def fetch_groups(api_base_url=f"{API_BASE}"):
    # Получаем список всех групп
    groups_response = requests.get(f"{api_base_url}/groups/")
    groups_data = groups_response.json()

    # Получаем список всех образовательных программ
    programs_response = requests.get(f"{api_base_url}/programs/")
    programs_data = programs_response.json()

    # Сопоставим ID программы и её код
    program_id_to_code = {program["id"]: program["code"] for program in programs_data}

    # Заполним словарь вида {program_code: {group_number: year}}
    grouped = defaultdict(dict)
    for group in groups_data:
        program_id = group["program"]
        group_number = group["number"]
        year = group["year"]
        program_code = program_id_to_code.get(program_id)
        if program_code and group_number:
            grouped[program_code][group_number] = year

    return dict(grouped)


# === Настройки ===
weekdays = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"]
max_classes_per_day = 4


# === Функции выбора аудитории ===
def choose_room(kind, department):
    return "Онлайн", ""


def choose_room_reboot(kind):
    return "Онлайн", ""


# === Класс занятия ===
class Session:
    def __init__(self, subject, kind, teacher, group, room, building, duration=1, semester=1):
        self.subject = subject
        self.kind = kind
        self.teacher = teacher
        self.group = group
        self.room = room
        self.building = building
        self.duration = duration
        self.semester = semester

    def __repr__(self):
        return f"{self.subject} {self.kind} {self.teacher} {self.room} {self.semester}"


# === Хелперы ===
def get_weeks(start, end):
    weeks = []
    current = start
    while current <= end:
        weeks.append(current)
        current += timedelta(days=7)
    return weeks


# === Новый парсер учебного плана ===
def expand_study_plan(plan, group_name):
    sessions = []
    for subject, data in plan.items():
        semester = data["Semester"]
        for kind in ["Lection", "Seminar", "Lab", "Sport"]:
            if kind in data:
                info = data[kind]
                count = info["Number"]
                teachers = info["Teacher"]
                department = data
                duration = 2 if kind == "Lab" else 1
                flag = False
                room_ = []
                building_ = []
                if kind == "Lection" or kind == "Sport":
                    for _ in range(count):
                        if teachers != "":
                            teacher = teachers
                        else:
                            teacher = ""
                        department = plan[subject]["Department"]
                        room, building = choose_room(kind, department)
                        sessions.append(Session(subject, kind, teacher, group_name, room, building, duration, semester))

                if kind == "Seminar":
                    for _ in range(count - 1):
                        if teachers != "":
                            teacher = teachers
                        else:
                            teacher = ""
                        department = plan[subject]["Department"]
                        if flag == False:
                            room, building = choose_room(kind, department)
                            sessions.append(
                                Session(subject, kind, teacher, group_name, room, building, duration, semester))
                            room_.append(room)
                            building_.append(building)
                            flag = True
                        if flag == True:
                            room = room_[0]
                            building = building_[0]
                            sessions.append(
                                Session(subject, kind, teacher, group_name, room, building, duration, semester))
                            flag = True

                if kind == "Lab":
                    for _ in range(count - 1):
                        if teachers != "":
                            teacher = teachers
                        else:
                            teacher = ""
                        department = plan[subject]["Department"]
                        if flag == False:
                            room, building = choose_room(kind, department)
                            sessions.append(
                                Session(subject, kind, teacher, group_name, room, building, duration, semester))
                            room_.append(room)
                            building_.append(building)
                            flag = True
                        if flag == True:
                            room = room_[0]
                            building = building_[0]
                            sessions.append(
                                Session(subject, kind, teacher, group_name, room, building, duration, semester))
                            flag = True

    return sessions


# === Объединение лекций и физкультуры ===
def merge_lections_sports(sessions):
    lections = {}
    sports = {}
    other = []
    for s in sessions:
        if s.kind == "Lection":
            key = (s.subject, s.kind, s.teacher)
            lections.setdefault(key, []).append(s)
        elif s.kind == "Sport":
            key = (s.subject, s.kind, s.teacher)
            sports.setdefault(key, []).append(s)
        else:
            other.append(s)

    merged = []
    for items in lections.values():
        if len(items) > 2:
            room, building = choose_room_reboot("Lection")
            for s in items:
                s.room = room
                s.building = building
        merged.extend(items)

    for items in sports.values():
        if len(items) > 2:
            room, building = choose_room_reboot("Sport")
            for s in items:
                s.room = room
                s.building = building
        merged.extend(items)

    return merged + other


# === Пустое расписание ===
def create_empty_schedule(weeks, groups, time_slots):
    schedule = {}
    for week in weeks:
        for group in groups:
            week_key = (group, week.strftime('%Y-%m-%d'))
            schedule[week_key] = {day: {slot: "-" for slot in time_slots[:-2]} for day in weekdays}
    return schedule


# === Проверки занятости ===
def is_teacher_busy(schedule, teacher, week_key, day, slot, session_kind):
    for (other_group, other_week), week_data in schedule.items():
        if other_week != week_key[1]:
            continue
        if schedule[(other_group, other_week)][day][slot] != "-":
            parts = schedule[(other_group, other_week)][day][slot].split(" | ")
            if len(parts) > 1:
                other_kind_info, other_teacher = parts[0], parts[1]
                if other_teacher == teacher:
                    other_kind = other_kind_info.split()[-1]
                    if session_kind in ["Seminar", "Lab"] or other_kind in ["Seminar", "Lab"]:
                        return True
    return False


def is_room_busy(schedule, room, building, week_key, day, slot, kind):
    for (group, week), week_data in schedule.items():
        if week != week_key[1]:
            continue
        val = week_data[day][slot]
        if val != "-":
            try:
                _, _, val_room_info = val.split(" | ")
                val_room, val_building = val_room_info.strip(")").split(" (")
                if val_room == room and val_building == building:
                    if kind != "Lection" and kind != "Sport":
                        return True
                    else:
                        other_kind = val.split(" | ")[0].split()[-1]
                        if other_kind != "Lection" and kind != "Sport":
                            return True
            except ValueError:
                continue
    return False


def has_window(day_schedule, start_index, duration, time_slots):
    occupied = [1 if day_schedule[slot] != "-" else 0 for slot in time_slots[:-2]]
    for i in range(start_index, start_index + duration):
        occupied[i] = 1
    in_block = False
    for val in occupied:
        if val == 1:
            if not in_block:
                in_block = True
        elif val == 0:
            if in_block:
                return True
    return False


def place_sessions(schedule, sessions, groups_info, semester_type, time_slots):
    """
    schedule: словарь расписания
    sessions: список объектов Session
    groups_info: словарь вида {program_code: {group_name: year}}
    semester_type: "осенний" или "весенний"
    """
    for session in sessions:
        # Получаем год обучения группы
        year = None
        for program_groups in groups_info.values():
            if session.group in program_groups:
                year = program_groups[session.group]
                break
        if year is None:
            print(f"[!] Неизвестный год для группы: {session.group}")
            continue

        # Определяем номер текущего семестра
        semester_number = year * 2 if semester_type == "весенний" else (year * 2) - 1

        # Пропускаем сессии не из текущего семестра
        if session.semester != semester_number:
            continue

        placed = False
        for week_key in schedule:
            group, week = week_key
            if group != session.group:
                continue

            used_sessions = set()
            for day in weekdays:
                for slot in time_slots[:-2]:
                    val = schedule[week_key][day][slot]
                    if val != "-":
                        subj_kind = val.split(" | ")[0]
                        used_sessions.add(subj_kind)

            session_key = f"{session.subject} {session.kind}"
            if session_key in used_sessions:
                continue

            for day in weekdays:
                day_schedule = schedule[week_key][day]
                busy_slots_count = sum(1 for val in day_schedule.values() if val != "-")
                if busy_slots_count + session.duration > max_classes_per_day:
                    continue

                for i in range(len(time_slots) - session.duration + 1):
                    slots = time_slots[i:i + session.duration]

                    if all(
                            day_schedule[slot] == "-" and
                            not is_teacher_busy(schedule, session.teacher, week_key, day, slot, session.kind) and
                            not is_room_busy(schedule, session.room, session.building, week_key, day, slot,
                                             session.kind)
                            for slot in slots
                    ):
                        if not has_window(day_schedule, i, session.duration, time_slots):
                            for j, slot in enumerate(slots):
                                day_schedule[slot] = (
                                    f"{session.subject} {session.kind} | "
                                    f"{session.teacher} {session.room} {session.building}"
                                )
                            placed = True
                            break
                if placed:
                    break
            if placed:
                break

        if not placed:
            print(f"[!] Не удалось вставить: {session.subject} {session.kind} {session.teacher}")

    return schedule


def fill_missing_time_slots(schedule, time_slots):
    for group_date in schedule:
        for day in ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']:
            # Если дня ещё нет, создаём его
            if day not in schedule[group_date]:
                schedule[group_date][day] = {}

            for slot in time_slots:
                if slot not in schedule[group_date][day]:
                    schedule[group_date][day][slot] = '-'

    return schedule


def convert_schedule_format(schedule_old):
    """
    schedule_old — расписание в формате:
    {
        "group": {
            "YYYY-MM-DD": {
                "День": {
                    "время": "предмет тип | преподаватель аудитория корпус" или "-"
                }
            }
        }
    }

    Возвращает расписание в формате:
    {
        "group": {
            "YYYY-MM-DD": {
                "День": {
                    "время": [предмет, тип, преподаватель, аудитория, корпус] или []
                }
            }
        }
    }
    """
    schedule_new = {}

    for group, dates in schedule_old.items():
        schedule_new[group] = {}
        for date, days in dates.items():
            schedule_new[group][date] = {}
            for day, times in days.items():
                schedule_new[group][date][day] = {}
                for time_slot, value in times.items():
                    if value == "-" or value.strip() == "":
                        # Нет пары — пустой список
                        schedule_new[group][date][day][time_slot] = []
                    else:
                        # Пример строки:
                        # "Реинжиниринг и управление бизнес-процессами Lection | Елисеева Н.В. 0206 New"
                        try:
                            # Разделяем на две части по " | "
                            subj_type_part, teacher_room_part = value.split(" | ")

                            # Последнее слово — корпус
                            parts = teacher_room_part.strip().split()
                            building = "Онлайн"
                            auditorium = parts[-1]  # аудитория
                            # преподаватель - всё до аудитории
                            teacher = " ".join(parts[:-1])

                            # предмет и тип - предмет это всё кроме последнего слова (типа занятия)
                            subj_type_words = subj_type_part.strip().split()
                            lesson_type = subj_type_words[-1]
                            subject = " ".join(subj_type_words[:-1])

                            schedule_new[group][date][day][time_slot] = [
                                subject, lesson_type, teacher, auditorium, building
                            ]
                        except Exception as e:
                            schedule_new[group][date][day][time_slot] = []

    return schedule_new


# === Настройки, данные и генерация ===
def generate_distance_schedule():
    start_date, end_date, time_slots, semester_type = load_schedule_settings()
    study_plan = build_study_plan()
    groups = fetch_groups()
    weeks = get_weeks(start_date, end_date)

    all_sessions = []
    for code, group_names in groups.items():
        for group in group_names:
            sessions = expand_study_plan(study_plan[code], group)
            all_sessions.extend(sessions)

    all_sessions = merge_lections_sports(all_sessions)

    schedule = {}
    for code in groups:
        schedule.update(create_empty_schedule(weeks, groups[code].keys(), time_slots))

    filled_schedule = place_sessions(schedule, all_sessions, groups, semester_type, time_slots)
    filled_schedule = fill_missing_time_slots(filled_schedule, time_slots)

    nested_data = defaultdict(dict)
    for (group, date), schedule in filled_schedule.items():
        nested_data[group][date] = schedule

    schedule_new = convert_schedule_format(nested_data)

    with open("media/json/schedule.json", "w", encoding="utf-8") as f:
        json.dump(schedule_new, f, ensure_ascii=False, indent=4)

    return schedule_new


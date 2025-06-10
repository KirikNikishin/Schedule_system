import fitz
import re
import os

def parse_pdf_file(file_path: str, name_schedule: str):
    pdf_filename = os.path.basename(file_path)
    directory = os.path.dirname(file_path) or "."

    study_plan = {}
    doc = fitz.open(file_path)

    subjects = []
    subject_names = []
    json_subject_names_details = []
    json_subject_names = []

    numbers_terms = ""
    flag = False
    no_seminars = False
    no_lections = False

    stop = False

    def subjects_by_term(subjects):
        terms = [[] for _ in range(11)]
        term_keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B']
        for subject in subjects:
            if not subject:
                continue
            for i, key in enumerate(term_keys):
                if re.search(rf'{key}', subject[-1]):
                    terms[i].append(subject[:-1])
        return terms

    expert_bug = False
    for page_num in range(1, len(doc) - 2):
        page = doc[page_num]
        text_dict = page.get_text("dict")

        for block in text_dict["blocks"]:
            for line in block.get("lines", []):
                spans = line.get("spans", [])
                if not spans:
                    continue

                span = spans[0]
                text = span.get("text", "")
                bbox_x = str(span.get("bbox", [0])[0])

                if bbox_x.startswith("530.") and text.startswith("Экспе"):
                    expert_bug = True

                def parse_subject_line():
                    nonlocal numbers_terms, no_seminars, no_lections, flag, subject_names
                    if text.lower().startswith(("б1.в.дв.01.02")):
                        subject_names.append("!!!!!!!!!!")
                        return True
                    if span["font"].lower().endswith("-bold"):
                        return False

                    if bbox_x.startswith("103."):
                        numbers_terms = ""
                        if text.lower().startswith("проект по "):
                            flag = True
                            return False
                        if text.lower().endswith('"'):
                            return False
                        flag = False
                        no_lections = True
                        subject_names.append(text)

                    if bbox_x.startswith(("309.", "311.", "313.", "343.", "345.", "374.", "377.")):
                        numbers_terms += text

                    if bbox_x.startswith(("645.", "646.", "610.", "611.")):
                        try:
                            numbers_lections = int(text)
                            if len(numbers_terms) > 1:
                                numbers_lections //= len(numbers_terms)
                            numbers_lections //= 2
                            subject_names.append(str(numbers_lections))
                            no_lections = False
                        except ValueError:
                            pass

                    if bbox_x.startswith(("681.6", "683.", "646.", "648.")):
                        try:
                            numbers_labs = int(text)
                            if len(numbers_terms) > 1:
                                numbers_labs //= len(numbers_terms)
                            numbers_labs //= 4
                            subject_names.append(str(numbers_labs))
                            no_seminars = True
                        except ValueError:
                            pass

                    if bbox_x.startswith(("716.9", "719.", "681.9", "682.", "684.")) and not flag:
                        try:
                            numbers_seminars = int(text)
                            if len(numbers_terms) > 1:
                                numbers_seminars //= len(numbers_terms)
                            numbers_seminars //= 2
                            subject_names.append(str(numbers_seminars))
                            no_seminars = False
                        except ValueError:
                            pass

                    if bbox_x.startswith(("1074.", "1076.", "1040.", "1042.", "1043.")) and not flag:
                        department = text
                        if no_seminars:
                            subject_names.append("no_seminars")
                            no_seminars = False
                        if no_lections:
                            subject_names.append("no_lections")
                            no_lections = False
                        subject_names.append(department)
                        subject_names.append(numbers_terms)
                        subjects.append(subject_names)
                        subject_names = []

                    return False

                if stop == False:
                    stop = parse_subject_line()

    # Очистка и нормализация
    for i, subject in enumerate(subjects):
        if not subject or subject[-1] == "":
            continue
        cleaned = []
        for j in range(len(subject)):
            if subject[j] == subject[j].lower() and subject[j] not in {"!!!!!!!!!!", "no_seminars", "no_lections"}:
                try:
                    int(subject[j])
                except ValueError:
                    if cleaned:
                        cleaned[-1] += subject[j]
                    continue
            elif len(subject[j]) < 4 and cleaned:
                cleaned[-1] += subject[j]
                continue
            cleaned.append(subject[j])
        subjects[i] = cleaned

    for subject in subjects:
        if not subject or subject[0] == "!!!!!!!!!!":
            continue
        json_subject_names_details = []
        for val in subject:
            if val != val.lower():
                if len(val) > 4:
                    json_subject_names_details.append(val)
            else:
                try:
                    int(val)
                    json_subject_names_details.append(val)
                except ValueError:
                    if val in {"no_seminars", "no_lections"}:
                        json_subject_names_details.append(val)
        if json_subject_names_details:
            json_subject_names.append(json_subject_names_details)

    terms = subjects_by_term(json_subject_names)

    if name_schedule not in study_plan:
        study_plan[name_schedule] = {}

    for semester in range(1, 9):
        for item in terms[semester - 1]:
            if not item or len(item) < 2:
                continue

            name = item[0]
            numbers = list(item[1:])

            try:
                department = int(numbers[-1])
                hours = numbers[:-1]
            except (IndexError, ValueError):
                continue

            discipline_data = {}
            placed = False

            try:
                if len(hours) > 0 and hours[-1] != "no_lections":
                    discipline_data["Lection"] = {"Number": int(hours[0]), "Teacher": ""}
                if len(hours) > 1:
                    if hours[-1] == "no_lections":
                        discipline_data["Seminar"] = {"Number": int(hours[0]), "Teacher": ""}
                    elif hours[-1] == "no_seminars":
                        discipline_data["Lab"] = {"Number": int(hours[1]), "Teacher": ""}
                        placed = True
                    else:
                        discipline_data["Seminar"] = {"Number": int(hours[1]), "Teacher": ""}
                if len(hours) > 2 and not placed:
                    if hours[-1] == "no_lections":
                        discipline_data["Lab"] = {"Number": int(hours[0]), "Teacher": ""}
                    else:
                        discipline_data["Lab"] = {"Number": int(hours[1]), "Teacher": ""}
                        discipline_data["Seminar"] = {"Number": int(hours[2]), "Teacher": ""}
            except (IndexError, ValueError):
                continue

            discipline_data["Department"] = department
            discipline_data["Semester"] = semester

            key = name
            while key in study_plan[name_schedule]:
                key += " "

            study_plan[name_schedule][key] = discipline_data

    return study_plan

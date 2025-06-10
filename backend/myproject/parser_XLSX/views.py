import os
import re
import json
import pandas as pd

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class UpdateTeachersFromExcelView(APIView):
    def post(self, request):
        pdf_dir = os.path.join(settings.MEDIA_ROOT, 'pdf')
        xlsx_dir = os.path.join(settings.MEDIA_ROOT, 'xlsx')
        json_dir = os.path.join(settings.MEDIA_ROOT, 'json')
        json_path = os.path.join(json_dir, 'subjects.json')

        if not os.path.exists(json_path):
            return Response({"error": "subjects.json не найден"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                subjects_data = json.load(f)

            updated_total = 0
            processed_files = []

            for filename in os.listdir(xlsx_dir):
                if filename.lower().endswith('.xlsx'):
                    file_path = os.path.join(xlsx_dir, filename)
                    match = re.search(r'([0-9]*)', filename)
                    if not match:
                        continue
                    department_number = int(match.group(1))

                    df = pd.read_excel(file_path)
                    updated = 0

                    for _, row in df.iterrows():
                        subject_name = str(row['Предмет']).strip()

                        for program_code, subjects in subjects_data.items():
                            if subject_name in subjects:
                                subject = subjects[subject_name]
                                if subject.get('Department') == department_number:
                                    if 'Лекции' in row and pd.notna(row['Лекции']):
                                        subject['Lection']['Teacher'] = str(row['Лекции']).strip()
                                    if 'Семинары' in row and pd.notna(row['Семинары']):
                                        subject['Seminar']['Teacher'] = str(row['Семинары']).strip()
                                    if 'Лабораторные' in row and pd.notna(row['Лабораторные']):
                                        subject['Lab']['Teacher'] = str(row['Лабораторные']).strip()
                                    updated += 1

                    updated_total += updated
                    processed_files.append(filename)

            output_path = os.path.join(json_dir, 'subjects_filled.json')
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(subjects_data, f, ensure_ascii=False, indent=4)

            os.remove(os.path.join(json_dir, 'subjects.json'))
            for filename in os.listdir(pdf_dir):
                os.remove(os.path.join(pdf_dir, filename))
            for filename in os.listdir(xlsx_dir):
                os.remove(os.path.join(xlsx_dir, filename))

            return Response({
                "message": "✅ Обработка завершена",
                "updated_subjects_total": updated_total,
                "files_processed": processed_files,
                "output_file": 'media/json/subjects_filled.json'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

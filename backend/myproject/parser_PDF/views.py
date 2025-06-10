from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

import os
import json
from django.conf import settings
from .parse_pdf import parse_pdf_file

import tempfile
import shutil
from pathlib import Path
import re

class BatchPDFProcessView(APIView):
    def post(self, request, *args, **kwargs):
        media_dir = settings.MEDIA_ROOT
        pdf_dir = os.path.join(media_dir, 'pdf')
        json_dir = os.path.join(media_dir, 'json')
        os.makedirs(json_dir, exist_ok=True)

        processed_files = []
        errors = []

        for filename in os.listdir(pdf_dir):
            if filename.lower().endswith('.pdf'):
                original_path = os.path.join(pdf_dir, filename)
                pdf_filename = os.path.basename(original_path)
                name_schedule_match = re.search(r' ([\d+\.\d+]+)', pdf_filename)
                name_schedule = name_schedule_match.group(1) if name_schedule_match else 'default'

                try:
                    # Временное имя
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
                        shutil.copyfile(original_path, temp_file.name)
                        temp_path = temp_file.name

                    result = parse_pdf_file(temp_path, name_schedule)

                    json_filename = Path(filename).stem + '.json'
                    json_path = os.path.join(json_dir, json_filename)

                    with open(json_path, 'w', encoding='utf-8') as json_file:
                        json.dump(result, json_file, ensure_ascii=False, indent=4)

                    processed_files.append({
                        'pdf': filename,
                        'json_path': f'../media/json/{json_filename}'
                    })

                    os.remove(temp_path)

                except Exception as e:
                    errors.append({'pdf': filename, 'error': str(e)})

        # Объединение всех JSON-файлов в subjects.json
        combined_data = {}
        for fname in os.listdir(json_dir):
            if fname == 'auditoriums.json':
                print("!!!!")
                continue

            fpath = os.path.join(json_dir, fname)
            if fname.endswith('.json') and fname != 'subjects.json':
                try:
                    with open(fpath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        combined_data.update(data)
                except Exception as e:
                    errors.append({'json': fname, 'error': str(e)})

        # Сохраняем объединённый файл
        combined_path = os.path.join(json_dir, 'subjects.json')
        with open(combined_path, 'w', encoding='utf-8') as f:
            json.dump(combined_data, f, ensure_ascii=False, indent=4)

        # Удаляем все остальные JSON-файлы, кроме subjects.json и auditoriums.json
        for fname in os.listdir(json_dir):
            if fname.endswith('.json') and fname != 'subjects.json' and fname != 'auditoriums.json':
                os.remove(os.path.join(json_dir, fname))

        return Response({
            'message': 'Обработка завершена',
            'processed': processed_files,
            'combined_json': f'../media/json/subjects.json',
            'errors': errors
        }, status=status.HTTP_200_OK if not errors else status.HTTP_207_MULTI_STATUS)

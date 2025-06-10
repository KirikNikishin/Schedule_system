from transformers import BertTokenizerFast, BertForSequenceClassification
import torch
import requests

# === Инициализация модели один раз ===
model_path = "media/bert_schedule_intents"
tokenizer = BertTokenizerFast.from_pretrained(model_path)
model = BertForSequenceClassification.from_pretrained(model_path)
model.eval()

id2label = model.config.id2label

def fetch_preferences() -> str:
    url = "http://localhost:8000/api/settings/"
    response = requests.get(url)
    response.raise_for_status()
    settings = response.json()
    if not settings or "preferences" not in settings[0]:
        raise Exception("Не удалось получить preferences из настроек")
    return settings[0]["preferences"]

def predict_intent_and_fetch_schedule() -> dict:
    text = fetch_preferences()
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=64)

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        predicted_class_id = torch.argmax(logits, dim=1).item()

    predicted_label = id2label[predicted_class_id]

    # Определение нужного эндпоинта
    if predicted_label == "remote_schedule":
        schedule_url = "http://localhost:8000/api/schedule-logic-distance/"
    elif predicted_label == "in_person_schedule":
        schedule_url = "http://localhost:8000/api/schedule-logic-face-to-face/"
    else:
        raise Exception(f"Неизвестное намерение: {predicted_label}")

    # Запрос расписания
    schedule_response = requests.get(schedule_url)
    schedule_response.raise_for_status()
    schedule_data = schedule_response.json()

    return {
        "intent": predicted_label
    }

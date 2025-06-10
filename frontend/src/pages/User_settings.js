import React, { useState, useEffect } from "react";
import NavigationSettingsTabs from "./NavigationSettingsTabs";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_BACKEND_URL;

function getCSRFToken() {
  const name = "csrftoken";
  return document.cookie.split("; ").find((row) => row.startsWith(name + "="))?.split("=")[1] || "";
}

const UserSettingsPage = () => {
  const [semesterType, setSemesterType] = useState("весенний");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/settings/`);
        const data = await res.json();
        if (data.length > 0) {
          const s = data[0];
          setSemesterType(s.semester_type);
          setStartDate(s.start_date);
          setEndDate(s.end_date);
          setNotes(s.preferences);
        }
      } catch (error) {
        console.error("Ошибка при загрузке настроек:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async () => {
    const csrfToken = getCSRFToken();
    const payload = {
      semester_type: semesterType,
      start_date: startDate,
      end_date: endDate,
      preferences: notes,
    };

    try {
      // 1. Сохраняем настройки
      const res = await fetch(`${API_URL}/settings/update/1/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFTOKEN": csrfToken,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Ошибка при сохранении настроек");
      }

      // 2. После успешного сохранения делаем запрос к /api/intent
      const intentRes = await fetch(`${API_URL}/intent/`, {
        method: "GET", 
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!intentRes.ok) {
        throw new Error("Ошибка при выполнении запроса intent");
      }
      
      // Выполняем POST-запрос на /load-schedule/
      const loadScheduleRes = await fetch(`${API_URL}/load-schedule/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFTOKEN": csrfToken,
        },
        body: JSON.stringify({}),
      });

      if (!loadScheduleRes.ok) {
        throw new Error("Ошибка при загрузке расписания");
      }

      // Переход на следующую страницу после успешного запроса intent
      navigate("/generate/group"); // замените на ваш путь

    } catch (error) {
      console.error("Ошибка:", error);
      alert("Произошла ошибка при сохранении настроек или выполнении запроса intent");
    }
  };

  const labelStyle = {
    width: "180px",
    fontWeight: "500",
    fontSize: "14px",
    marginRight: "16px",
  };

  const inputlabelStyle = {
    width: "450px",
    fontWeight: "500",
    fontSize: "14px",
    marginBottom: "20px",
  };

  const inputStyle = {
    flex: 1,
    padding: "8px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
  };

  const fieldRowStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
    maxWidth: "600px",
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Segoe UI, sans-serif" }}>
      <div className="d-flex align-items-center justify-content-between w-100 mb-0 px-2">
        <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Пользовательские настройки</div>
      </div>

      <div className="d-flex align-items-center w-30 mb-0 px-2">
        <div style={{ color: "gray" }}>
          Задайте свои настройки для автоматического планирования расписаний
        </div>
      </div>

      <NavigationSettingsTabs />

      <div className="d-flex align-items-center w-30 px-2" style={fieldRowStyle}>
        <label style={labelStyle}>Тип семестра</label>
        <select value={semesterType} onChange={(e) => setSemesterType(e.target.value)} style={inputStyle}>
          <option value="весенний">весенний</option>
          <option value="осенний">осенний</option>
        </select>
      </div>

      <div className="d-flex align-items-center w-30 px-2" style={fieldRowStyle}>
        <label style={labelStyle}>Дата начала семестра</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
      </div>

      <div className="d-flex align-items-center w-30 px-2" style={fieldRowStyle}>
        <label style={labelStyle}>Дата окончания семестра</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label className="d-flex align-items-center w-30 px-2" style={inputlabelStyle}>
          Укажите свои предпочтения по планированию расписаний
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder="Введите свои предпочтения по планированию расписаний"
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "14px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            resize: "vertical",
            backgroundColor: "#fff",
            marginLeft: "6px",
          }}
        />
      </div>

      <Button onClick={handleSubmit} variant="dark">
        Сохранить настройки
      </Button>
    </div>
  );
};

export default UserSettingsPage;

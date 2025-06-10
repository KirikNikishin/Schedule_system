import React, { useEffect, useState } from "react";
import { startOfWeek, isSameWeek, format } from "date-fns";
import NavigationScheduleEditTabs from "./NavigationScheduleEditTabs";
import { Button } from "react-bootstrap";

function getCSRFToken() {
  const name = "csrftoken";
  return document.cookie.split("; ").find(row => row.startsWith(name + "="))?.split("=")[1] || "";
}

const API_URL = process.env.REACT_APP_BACKEND_URL

const Auditorium_edit_schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [times, setTimes] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [auditoriums, setAuditoriums] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedAuditorium, setSelectedAuditorium] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [typeLessons, setTypeLessons] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [selectedTypeLesson, setSelectedTypeLesson] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");

  const daysOfWeek = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          scheduleRes, timesRes, buildingsRes, auditoriumsRes, typeLessonsRes, teachersRes
        ] = await Promise.all([
          fetch(`${API_URL}/schedules`),
          fetch(`${API_URL}/times/`),
          fetch(`${API_URL}/buildings/`),
          fetch(`${API_URL}/auditoriums/`),
          fetch(`${API_URL}/typelessons/`),
          fetch(`${API_URL}/teachers/`)
        ]);

        const [
          scheduleData, timesData, buildingsData, auditoriumsData, typeLessonsData, teachersData
        ] = await Promise.all([
          scheduleRes.json(),
          timesRes.json(),
          buildingsRes.json(),
          auditoriumsRes.json(),
          typeLessonsRes.json(),
          teachersRes.json()
        ]);

        setSchedule(scheduleData);
        setTimes(timesData.sort((a, b) => {
          const [ah, am] = a.time.split(" - ")[0].split(":").map(Number);
          const [bh, bm] = b.time.split(" - ")[0].split(":").map(Number);
          return ah * 60 + am - (bh * 60 + bm);
        }));
        setBuildings(buildingsData);
        setAuditoriums(auditoriumsData.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));
        setTypeLessons(typeLessonsData);
        setTeachers(teachersData);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      }
    };

    fetchData();
  }, []);

  const startOfSelectedWeek = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const filteredSchedule = schedule.filter(
    (item) =>
      item.auditorium === selectedAuditorium &&
      isSameWeek(new Date(item.date), startOfSelectedWeek, { weekStartsOn: 1 })
  );

  const handleSave = async () => {
    const csrf = getCSRFToken();
    const payload = {
      group: modalData.group,
      date: modalData.date,
      day_of_week: modalData.day,
      time: modalData.time,
      subject: modalData.subject,
      type_lesson: selectedTypeLesson,
      teacher: modalData.teacher,
      auditorium: selectedAuditorium,
      building: selectedBuilding
    };

    const url = modalData.id
      ? `${API_URL}/schedules/update/${modalData.id}/`
      : `${API_URL}/schedules/create/`;

    try {
      const response = await fetch(url, {
        method: modalData.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFTOKEN": csrf,
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setSchedule(prev => modalData.id
        ? prev.map(s => s.id === modalData.id ? data : s)
        : [...prev, data]);

      setShowModal(false);
    } catch (error) {
      console.error("Ошибка при сохранении:", error);
    }
  };

  const openModal = (day, time, lesson) => {
    setModalData({
      id: lesson?.id || null,
      day,
      time,
      date: lesson?.date || format(startOfSelectedWeek, "yyyy-MM-dd"),
      subject: lesson?.subject || "",
      group: lesson?.group || "",
    });
    setSelectedTypeLesson(lesson?.type_lesson || "");
    setSelectedTeacher(lesson?.teacher || "");
    setShowModal(true);
  };

  const inputStyle = {
    flex: 1,
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    padding: "8px",
    marginLeft: "16px",
    backgroundColor: "#fff",
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: "10px",
  };

  const labelStyle = {
    minWidth: "120px",
    textAlign: "right",
    marginRight: "16px",
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Segoe UI, sans-serif" }}>
      <>
          <div className="d-flex align-items-center justify-content-between w-50 mb-2 px-2" />
  
          <div className="d-flex align-items-center justify-content-between w-100 mb-0 px-2">
            <div
              className="m-0 text-wrap"
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                whiteSpace: 'normal'
              }}
            >
              Редактируйте расписание
            </div>
          </div>
  
          <div className="d-flex align-items-center w-30 mb-0 px-2">
            <div
              className="m-0 text-wrap"
              style={{
                color: 'gray',
                whiteSpace: 'normal'
              }}
            >
              Редактируйте расписание под дополнительные требования и экспортируйте готовое расписание в pdf
            </div>
          </div>
      </>
      <NavigationScheduleEditTabs />
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <div>
          <label>Корпус: </label>
          <select
            value={selectedBuilding}
            style={inputStyle}
            onChange={(e) => {
              setSelectedBuilding(e.target.value);
              setSelectedAuditorium("");
            }}
          >
            <option value="">Выберите корпус</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name === "Old" ? "Старый корпус" : b.name === "New" ? "Новый корпус" : b.name === "Frezer" ? "Фрезер" : "Стадион"} 
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Аудитория: </label>
          <select
            value={selectedAuditorium}
            onChange={(e) => setSelectedAuditorium(e.target.value)}
            style={inputStyle}
            disabled={!selectedBuilding}
          >
            <option value="">Выберите аудиторию</option>
            {auditoriums
              .filter((a) => a.building === Number(selectedBuilding))
              .map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label>Неделя: </label>
          <input
            type="date"
            value={format(selectedWeek, "yyyy-MM-dd")}
            onChange={(e) => setSelectedWeek(new Date(e.target.value))}
            style={inputStyle}
          />
        </div>
      </div>

      {selectedAuditorium && (
        <table style={{ borderCollapse: "collapse", width: "100%", textAlign: "center" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>День</th>
              {times.map((time) => (
                <th key={time.id} style={{ border: "1px solid #ccc", padding: "8px", backgroundColor: "#f2f2f2" }}>{time.time}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daysOfWeek.map((day) => (
              <tr key={day}>
                <td style={{ border: "1px solid #ccc", padding: "8px", fontWeight: "bold", backgroundColor: "#f9f9f9" }}>{day}</td>
                {times.map((time) => {
                  const lessons = filteredSchedule.filter(s => s.day_of_week === day && s.time === time.time);
                  if (lessons.length === 0) {
                    return (
                      <td
                        key={time.id}
                        style={{ border: "1px solid #ccc", padding: "8px", cursor: "pointer" }}
                        onClick={() => openModal(day, time.time, null)}
                      />
                    );
                  }
                  // Пары в одно и то же время — значит, показываем все группы
                  const { subject, type_lesson, teacher } = lessons[0];
                  const allGroups = lessons.map(l => l.group).join(", ");
                  return (
                    <td key={time.id} style={{ border: "1px solid #ccc", padding: "8px", cursor: "pointer" }} onClick={() => openModal(day, time.time, lessons[0])}>
                          <div>{subject}</div>
                          <div style={{ fontSize: "12px", color: "#555" }}>
                            {type_lesson === "Lection"
                              ? "Лекции"
                              : type_lesson === "Seminar"
                              ? "Семинары"
                              : type_lesson === "Lab"
                              ? "Лаб. раб."
                              : "Физкультура"}{" "}
                            • {allGroups}
                          </div>
                          <div style={{ fontSize: "12px", color: "#777" }}>{teacher}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "#fff", padding: "50px", borderRadius: "8px", width: "950px" }}>
            <h4>Редактировать занятия</h4>
            <div style={rowStyle}>
              <label style={labelStyle}>Предмет:</label>
              <input name="subject" value={modalData.subject} onChange={e => setModalData({ ...modalData, subject: e.target.value })} style={inputStyle} />
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>Группа:</label>
              <input name="group" value={modalData.group} onChange={e => setModalData({ ...modalData, group: e.target.value })} style={inputStyle} />
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>Преподаватель:</label>
              <input
                name="teacher"
                value={modalData.teacher}
                onChange={e => setModalData({ ...modalData, teacher: e.target.value })}
                placeholder="Преподаватель"
                style={inputStyle}
              />
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>Тип занятия:</label>
              <select value={selectedTypeLesson} onChange={(e) => setSelectedTypeLesson(e.target.value)} style={inputStyle}>
                <option value="">Тип</option>
                {typeLessons.map(t => (
                    <option key={t.id} value={t.name}>
                      {t.name === "Lection" ? "Лекции" :
                      t.name === "Seminar" ? "Семинары" :
                      t.name === "Lab" ? "Лаб. раб." :
                      "Физкультура"}
                    </option>
                  ))}
              </select>
            </div>
            <div style={{ marginTop: "10px" }}>
              <Button variant="dark" onClick={handleSave}>Сохранить</Button>
              <Button variant="dark" onClick={() => setShowModal(false)} style={{ marginLeft: "10px" }}>Отмена</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auditorium_edit_schedule;

import React, { useEffect, useState } from "react";
import { startOfWeek, isSameWeek, format } from "date-fns";
import NavigationScheduleEditTabs from "./NavigationScheduleEditTabs";
import { Button } from "react-bootstrap";

const API_URL = process.env.REACT_APP_BACKEND_URL

function getCSRFToken() {
  const name = "csrftoken";
  const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
  return cookieValue || "";
}

const Teacher_edit_schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [times, setTimes] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("Толок А.В");
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [typeLessons, setTypeLessons] = useState([]);
  const [buildings, setBuildings] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [selectedTypeLesson, setSelectedTypeLesson] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("");

  const daysOfWeek = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scheduleRes, timesRes, teachersRes, departmentsRes, typeLessonsRes, buildingsRes] =
          await Promise.all([
            fetch(`${API_URL}/schedules/`),
            fetch(`${API_URL}/times/`),
            fetch(`${API_URL}/teachers/`),
            fetch(`${API_URL}/departments/`),
            fetch(`${API_URL}/typelessons/`),
            fetch(`${API_URL}/buildings/`)
          ]);

        const [
          scheduleData,
          timesData,
          teachersData,
          departmentsData,
          typeLessonsData,
          buildingsData
        ] = await Promise.all([
          scheduleRes.json(),
          timesRes.json(),
          teachersRes.json(),
          departmentsRes.json(),
          typeLessonsRes.json(),
          buildingsRes.json()
        ]);

        const sortedTimes = timesData.sort((a, b) => {
          const getStart = (t) => t.split(" - ")[0].split(":").map(Number);
          const [ah, am] = getStart(a.time);
          const [bh, bm] = getStart(b.time);
          return ah * 60 + am - (bh * 60 + bm);
        });

        const sortedDepartments = departmentsData.sort((a, b) => a.department_code - b.department_code);

        setSchedule(scheduleData);
        setTimes(sortedTimes);
        setTeachers(teachersData);
        setDepartments(sortedDepartments);
        setTypeLessons(typeLessonsData);
        setBuildings(buildingsData);
      } catch (err) {
        console.error("Ошибка при загрузке:", err);
      }
    };

    fetchData();
  }, []);

  const startOfSelectedWeek = startOfWeek(selectedWeek, { weekStartsOn: 1 });

  const filteredSchedule = schedule.filter(
    (item) =>
      item.teacher === selectedTeacher &&
      isSameWeek(new Date(item.date), startOfSelectedWeek, { weekStartsOn: 1 })
  );

  const openModal = (day, time, lesson) => {
    setModalData({
      id: lesson?.id || null,
      day,
      time,
      date: lesson?.date || format(startOfSelectedWeek, "yyyy-MM-dd"),
      subject: lesson?.subject || "",
      group: lesson?.group || "",
      auditorium: lesson?.auditorium || "",
      teacher: selectedTeacher,
    });
    setSelectedTypeLesson(lesson?.type_lesson || "");
    setSelectedBuilding(lesson?.building || "");
    setShowModal(true);
  };

  const handleModalChange = (e) => {
    setModalData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    const csrf = getCSRFToken();
    const payload = {
      group: modalData.group,
      date: modalData.date,
      day_of_week: modalData.day,
      time: modalData.time,
      subject: modalData.subject,
      type_lesson: selectedTypeLesson,
      teacher: selectedTeacher,
      auditorium: modalData.auditorium,
      building: selectedBuilding
    };

    const url = modalData.id
      ? `${API_URL}/schedules/update/${modalData.id}/`
      : `${API_URL}/schedules/create/`;

    const method = modalData.id ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-CSRFTOKEN": csrf,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const updated = await res.json();
      setSchedule((prev) =>
        modalData.id
          ? prev.map((s) => (s.id === modalData.id ? updated : s))
          : [...prev, updated]
      );
      setShowModal(false);
    } catch (err) {
      console.error("Ошибка при сохранении:", err);
    }
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: "10px",
  };

  const labelStyle = {
    minWidth: "120px", // одинаковая ширина для всех меток
    textAlign: "right",
    marginRight: "16px",
  };

  const inputmodalStyle = {
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    padding: "8px",
    backgroundColor: "#fff",
    width: "700px",
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
          <label>Кафедра:</label>
          <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} style={inputStyle}>
            <option value="">Выберите кафедру</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.department_code}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Преподаватель:</label>
          <select
              value={selectedTeacher}
              style={inputStyle}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              disabled={!selectedDepartment}
            >
              <option value="">Выберите преподавателя</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
        </div>
        <div>
          <label>Неделя:</label>
          <input
            type="date"
            value={format(selectedWeek, "yyyy-MM-dd")}
            onChange={(e) => setSelectedWeek(new Date(e.target.value))}
            style={inputStyle}
          />
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>День</th>
            {times.map((t) => (
              <th key={t.id} style={{ border: "1px solid #ccc", padding: "8px", backgroundColor: "#f2f2f2" }}>
                {t.time}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {daysOfWeek.map((day) => (
            <tr key={day}>
              <td style={{ border: "1px solid #ccc", padding: "8px", fontWeight: "bold", backgroundColor: "#f9f9f9" }}>
                {day}
              </td>
              {times.map((time) => {
                const lessons = filteredSchedule.filter(
                  (s) => s.day_of_week === day && s.time === time.time
                );

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
                const { subject, type_lesson, auditorium } = lessons[0];
                const allGroups = lessons.map(l => l.group).join(", ");

                return (
                  <td
                    key={time.id}
                    style={{ border: "1px solid #ccc", padding: "8px", cursor: "pointer" }}
                    onClick={() => openModal(day, time.time, lessons[0])}
                  >
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
                    <div style={{ fontSize: "12px", color: "#777" }}>{auditorium}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>

      </table>

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "#fff", padding: "50px", borderRadius: "8px", width: "950px" }}>
            <h4>Редактировать занятия</h4>
            <div style={rowStyle}>
                <label style={labelStyle}>Предмет:</label>
                <input name="subject" placeholder="Предмет" value={modalData.subject} onChange={handleModalChange} style={inputStyle} />
            </div>
            <div style={rowStyle}>
                <label style={labelStyle}>Группа:</label>
                <input name="group" placeholder="Группа" value={modalData.group} onChange={handleModalChange} style={inputStyle} />
            </div>
            <div style={rowStyle}>
                <label style={labelStyle}>Аудитория:</label>
                <input name="auditorium" placeholder="Аудитория" value={modalData.auditorium} onChange={handleModalChange} style={inputStyle} />
            </div>
            <div style={rowStyle}>
                <label style={labelStyle}>Тип занятия:</label>
                <select
                  value={selectedTypeLesson}
                  onChange={(e) => setSelectedTypeLesson(e.target.value)}
                  style={inputmodalStyle}
                >
                  <option value="">Тип занятия</option>
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
            <div style={rowStyle}>
                <label style={labelStyle}>Корпус:</label>
                <select
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  style={inputmodalStyle}
                >
                  <option value="">Корпус</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.name}>
                      {b.name === "Old" ? "Старый корпус" :
                      b.name === "New" ? "Новый корпус" :
                      b.name === "Frezer" ? "Фрезер" :
                      "Стадион"}
                    </option>
                  ))}
                </select>
              </div>
            <Button variant="dark" onClick={handleSave} style={{ marginTop: "10px" }}>Сохранить</Button>
                          <Button variant="dark" onClick={() => setShowModal(false)} style={{ marginTop: "10px", marginLeft: "10px" }}>Отмена</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teacher_edit_schedule;

import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { startOfWeek, isSameWeek, format } from "date-fns";
import { Button } from "react-bootstrap";
import axios from "axios";
import { alignPropType } from "react-bootstrap/esm/types";
import NavigationScheduleEditTabs from "./NavigationScheduleEditTabs";

const API_URL = process.env.REACT_APP_BACKEND_URL

function getCSRFToken() {
  const name = 'csrftoken';
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1];
  return cookieValue || '';
}

const Group_edit_schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [times, setTimes] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ day: '', time: '', subject: '', teacher: '', auditorium: '' });
  const [buildings, setBuildings] = useState([]);
  const [typeLessons, setTypeLessons] = useState([]);
  const [selectedTypeLesson, setSelectedTypeLesson] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("");

  const daysOfWeek = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [
          scheduleRes,
          timesRes,
          programsRes,
          groupsRes,
          buildingsRes,
          typeLessonsRes
        ] = await Promise.all([
          fetch(`${API_URL}/schedules/`),
          fetch(`${API_URL}/times/`),
          fetch(`${API_URL}/programs/`),
          fetch(`${API_URL}/groups/`),
          fetch(`${API_URL}/buildings/`),
          fetch(`${API_URL}/typelessons/`)
        ]);

        const [
          scheduleData,
          timesData,
          programsData,
          groupsData,
          buildingsData,
          typeLessonsData
        ] = await Promise.all([
          scheduleRes.json(),
          timesRes.json(),
          programsRes.json(),
          groupsRes.json(),
          buildingsRes.json(),
          typeLessonsRes.json()
        ]);

        const sortedTimes = timesData.sort((a, b) => {
          const getStartTime = (timeStr) => timeStr.split(" - ")[0].split(":").map(Number);
          const [ah, am] = getStartTime(a.time);
          const [bh, bm] = getStartTime(b.time);
          return ah * 60 + am - (bh * 60 + bm);
        });

        setSchedule(scheduleData);
        setTimes(sortedTimes);
        setPrograms(programsData);
        setGroups(groupsData);
        setBuildings(buildingsData);
        setTypeLessons(typeLessonsData);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      }
    };

    fetchInitialData();
  }, []);

  const handleExportSchedule = async (groupNumber) => {
    try {
      const response = await fetch(`${API_URL}/schedule/download/${groupNumber}`, {
        method: "GET",
        headers: {
          Accept: "text/html"
        }
      });

      if (!response.ok) {
        throw new Error("Ошибка при экспорте расписания");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${groupNumber}.html`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка при скачивании расписания:", error);
    }
  };


  const startOfSelectedWeek = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const filteredSchedule = schedule.filter(
    (item) =>
      item.group === selectedGroup &&
      isSameWeek(new Date(item.date), startOfSelectedWeek, { weekStartsOn: 1 })
  );

  const filteredGroups = groups.filter(
    (group) =>
      programs.find((prog) => prog.code === selectedProgram && prog.id === group.program)
  );

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
    backgroundColor: "#fff", // Белый фон
  };

  const openModal = (day, time, lesson) => {
    setModalData({
      id: lesson?.id || null,
      day,
      time,
      subject: lesson?.subject || '',
      teacher: lesson?.teacher || '',
      auditorium: lesson?.auditorium || '',
      building: lesson?.building || '',
      date: lesson?.date || format(startOfSelectedWeek, "yyyy-MM-dd"),
    });
    setSelectedTypeLesson(lesson?.type_lesson || "");
    setSelectedBuilding(lesson?.building || "");
    setShowModal(true);
  };

  const handleModalChange = (e) => {
    setModalData({ ...modalData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const csrfToken = getCSRFToken();
    const payload = {
      group: selectedGroup,
      date: modalData.date,
      day_of_week: modalData.day,
      time: modalData.time,
      subject: modalData.subject,
      type_lesson: selectedTypeLesson,
      teacher: modalData.teacher,
      auditorium: modalData.auditorium,
      building: selectedBuilding
    };

    const url = modalData.id
      ? `${API_URL}/schedules/update/${modalData.id}/`
      : `${API_URL}/schedules/create/`;

    const method = modalData.id ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-CSRFTOKEN": csrfToken,
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Ошибка при сохранении");
      }

      const newItem = await response.json();

      setSchedule((prevSchedule) => {
        if (modalData.id) {
          return prevSchedule.map(item =>
            item.id === modalData.id ? newItem : item
          );
        } else {
          return [...prevSchedule, newItem];
        }
      });

      setShowModal(false);
    } catch (error) {
      console.error("Ошибка при сохранении:", error);
    }
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
          <label>Направление: </label>
          <select
            value={selectedProgram}
            style={inputStyle}
            onChange={(e) => {
              setSelectedProgram(e.target.value);
              setSelectedGroup("");
            }}
          >
            <option value="">Выберите направление</option>
            {programs.map((p) => (
              <option key={p.id} value={p.code}>{p.code}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Группа: </label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            disabled={!selectedProgram}
            style={inputStyle}
          >
            <option value="">Выберите группу</option>
            {filteredGroups.map((g) => (
              <option key={g.id} value={g.number}>{g.number}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Подгруппа: </label>
          <select style={inputStyle}>
            <option value="">А</option>
            <option>Б</option>
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

      {selectedGroup && (
        <table style={{ borderCollapse: "collapse", width: "100%", textAlign: "center" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>День</th>
              {times.map((time) => (
                <th
                  key={time.id}
                  style={{ border: "1px solid #ddd", padding: "8px", backgroundColor: "#f2f2f2" }}
                >
                  {time.time}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daysOfWeek.map((day) => (
              <tr key={day}>
                <td style={{ border: "1px solid #ddd", padding: "8px", fontWeight: "bold", backgroundColor: "#f9f9f9" }}>
                  {day}
                </td>
                {times.map((time) => {
                  const lesson = filteredSchedule.find(
                    (item) => item.day_of_week === day && item.time === time.time
                  );
                  return (
                    <td
                      key={time.id}
                      style={{ border: "1px solid #ddd", padding: "8px", cursor: "pointer" }}
                      onClick={() => openModal(day, time.time, lesson)}
                    >
                      {lesson?.subject && (
                        <>
                          <div>{lesson.subject}</div>
                          <div style={{ fontSize: "12px", color: "#555" }}>
                            {lesson.type_lesson === "Lection"
                              ? "Лекция"
                              : lesson.type_lesson === "Seminar"
                              ? "Семинар"
                              : lesson.type_lesson === "Lab"
                              ? "Лаб. работа"
                              : "Физкультура"} • {lesson.teacher}
                          </div>
                          <div style={{ fontSize: "12px", color: "#777" }}>{lesson.auditorium}</div>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", padding: "50px", borderRadius: "8px", width: "950px" }}>
              <h4>Редактирование занятия</h4>
              <div style={rowStyle}>
                <label style={labelStyle}>Предмет:</label>
                <input
                  name="subject"
                  value={modalData.subject}
                  onChange={handleModalChange}
                  placeholder="Предмет"
                  style={inputmodalStyle}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Преподаватель:</label>
                <input
                  name="teacher"
                  value={modalData.teacher}
                  onChange={handleModalChange}
                  placeholder="Преподаватель"
                  style={inputmodalStyle}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Аудитория:</label>
                <input
                  name="auditorium"
                  value={modalData.auditorium}
                  onChange={handleModalChange}
                  placeholder="Аудитория"
                  style={inputmodalStyle}
                />
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

export default Group_edit_schedule;

import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { startOfWeek, isSameWeek, format } from "date-fns";
import NavigationScheduleTabs from "./NavigationScheduleTabs";

const API_URL = process.env.REACT_APP_BACKEND_URL

const Auditorium_watch_schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [times, setTimes] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [auditoriums, setAuditoriums] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedAuditorium, setSelectedAuditorium] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  const daysOfWeek = [
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scheduleRes, timesRes, buildingsRes, auditoriumsRes] =
          await Promise.all([
            fetch(`${API_URL}/schedules/`),
            fetch(`${API_URL}/times/`),
            fetch(`${API_URL}/buildings/`),
            fetch(`${API_URL}/auditoriums/`),
          ]);

        const [scheduleData, timesData, buildingsData, auditoriumsData] =
          await Promise.all([
            scheduleRes.json(),
            timesRes.json(),
            buildingsRes.json(),
            auditoriumsRes.json(),
          ]);

        const sortedTimes = timesData.sort((a, b) => {
          const [ah, am] = a.time.split(" - ")[0].split(":").map(Number);
          const [bh, bm] = b.time.split(" - ")[0].split(":").map(Number);
          return ah * 60 + am - (bh * 60 + bm);
        });

        const sortedAuditoriums = auditoriumsData.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true })
        );

        setSchedule(scheduleData);
        setTimes(sortedTimes);
        setBuildings(buildingsData);
        setAuditoriums(sortedAuditoriums);
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
      isSameWeek(new Date(item.date), startOfSelectedWeek, {
        weekStartsOn: 1,
      })
  );

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
                          Расписания составлены
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
                          Проверьте расписание на наличие накладок и переходите в "Редактирование расписания"
                        </div>
                      </div>
                  </>
                  
                  <NavigationScheduleTabs />

      <div
        className="d-flex align-items-center justify-content-between w-100 mb-0 px-2"
      >
      </div>

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
            {buildings
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name === "Frezer" ? "Фрезер" : b.name === "Old" ? "Старый корпус" : b.name === "New" ? "Новый корпус" : "Стадион"}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label>Аудитория: </label>
          <select
            value={selectedAuditorium}
            style={inputStyle}
            onChange={(e) => setSelectedAuditorium(e.target.value)}
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
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            textAlign: "center",
          }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>День</th>
              {times.map((time) => (
                <th
                  key={time.id}
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    backgroundColor: "#f2f2f2",
                  }}
                >
                  {time.time}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {daysOfWeek.map((day) => (
              <tr key={day}>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    fontWeight: "bold",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  {day}
                </td>
                {times.map((time) => {
                  const lesson = filteredSchedule.find(
                    (item) =>
                      item.day_of_week === day && item.time === time.time
                  );
                  return (
                    <td
                      key={time.id}
                      style={{ border: "1px solid #ddd", padding: "8px" }}
                    >
                      {lesson && lesson.subject ? (
                        <>
                          <div>{lesson.subject}</div>
                          <div style={{ fontSize: "12px", color: "#555" }}>
                            {lesson.type_lesson === "Lection"
                              ? "Лекции"
                              : lesson.type_lesson === "Seminar"
                              ? "Семинары"
                              : lesson.type_lesson === "Lab"
                              ? "Лаб. раб."
                              : "Физкультура"}{" "}
                            • {lesson.group}
                          </div>
                          <div style={{ fontSize: "12px", color: "#777" }}>
                            {lesson.teacher}
                          </div>
                        </>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Auditorium_watch_schedule;

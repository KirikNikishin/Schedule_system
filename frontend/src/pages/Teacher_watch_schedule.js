import React, { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { startOfWeek, isSameWeek, format } from "date-fns";
import NavigationScheduleTabs from "./NavigationScheduleTabs";

const API_URL = process.env.REACT_APP_BACKEND_URL

const Teacher_watch_schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [times, setTimes] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("Толок А.В");
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
    const fetchInitialData = async () => {
      try {
        const [scheduleRes, timesRes, teachersRes, departmentsRes] =
          await Promise.all([
            fetch(`${API_URL}/schedules/`),
            fetch(`${API_URL}/times/`),
            fetch(`${API_URL}/teachers/`),
            fetch(`${API_URL}/departments/`),
          ]);

        const [scheduleData, timesData, teachersData, departmentsData] =
          await Promise.all([
            scheduleRes.json(),
            timesRes.json(),
            teachersRes.json(),
            departmentsRes.json(),
          ]);

        const sortedTimes = timesData.sort((a, b) => {
          const getStartTime = (timeStr) =>
            timeStr.split(" - ")[0].split(":").map(Number);
          const [ah, am] = getStartTime(a.time);
          const [bh, bm] = getStartTime(b.time);
          return ah * 60 + am - (bh * 60 + bm);
        });

        const sortedDepartments = departmentsData.sort(
          (a, b) => a.department_code - b.department_code
        );

        setSchedule(scheduleData);
        setTimes(sortedTimes);
        setTeachers(teachersData);
        setDepartments(sortedDepartments);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      }
    };

    fetchInitialData();
  }, []);

  const startOfSelectedWeek = startOfWeek(selectedWeek, { weekStartsOn: 1 });

  const filteredSchedule = schedule.filter(
    (item) =>
      item.teacher === selectedTeacher &&
      isSameWeek(new Date(item.date), startOfSelectedWeek, { weekStartsOn: 1 })
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
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div>
          <label>
            Кафедра:
          </label>
          <select
            value={selectedDepartment}
            style={inputStyle}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">Выберите кафедру</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.department_code}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>
            Преподаватель:
          </label>
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
          <label>
            Неделя:
          </label>
          <input
            type="date"
            value={format(selectedWeek, "yyyy-MM-dd")}
            onChange={(e) => setSelectedWeek(new Date(e.target.value))}
            style={inputStyle}
          />
        </div>
      </div>

      {selectedTeacher && (
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
                            {lesson.auditorium}
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

export default Teacher_watch_schedule;

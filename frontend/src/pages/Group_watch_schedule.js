import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { startOfWeek, isSameWeek, format, parseISO } from "date-fns";
import NavigationScheduleTabs from "./NavigationScheduleTabs";

const API_URL = process.env.REACT_APP_BACKEND_URL

const Group_watch_schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [times, setTimes] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
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
        const [scheduleRes, timesRes, programsRes, groupsRes] = await Promise.all([
          fetch(`${API_URL}/schedules/`),
          fetch(`${API_URL}/times/`),
          fetch(`${API_URL}/programs/`),
          fetch(`${API_URL}/groups/`),
        ]);

        const [scheduleData, timesData, programsData, groupsData] = await Promise.all([
          scheduleRes.json(),
          timesRes.json(),
          programsRes.json(),
          groupsRes.json(),
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
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      }
    };

    fetchInitialData();
  }, []);

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

  const inputStyle = {
    flex: 1,
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    padding: "8px",
    marginLeft: "16px",
    backgroundColor: "#fff", // Белый фон
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
          <label>Подгруппа:</label>
          <select style={inputStyle}>
            <option>А</option>
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
        <table
          style={{ borderCollapse: "collapse", width: "100%", textAlign: "center" }}
        >
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
                    (item) => item.day_of_week === day && item.time === time.time
                  );
                  return (
                    <td key={time.id} style={{ border: "1px solid #ddd", padding: "8px" }}>
                      {lesson && lesson.subject ? (
                        <>
                          <div>{lesson.subject}</div>
                          <div style={{ fontSize: "12px", color: "#555" }}>
                            {lesson.type_lesson === "Lection" ? "Лекции" : lesson.type_lesson === "Seminar" ? "Семинары" : lesson.type_lesson === "Lab" ? "Лаб. раб." : "Физкультура"} • {lesson.teacher}
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

export default Group_watch_schedule;

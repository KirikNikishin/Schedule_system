import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import NavigationSettingsTabs from "./NavigationSettingsTabs";
import { Button } from 'react-bootstrap';

const API_URL = process.env.REACT_APP_BACKEND_URL
const API_BASE = `${API_URL}/times`;

const TimePositionsPage = () => {
  const [timePositions, setTimePositions] = useState([]);
  const csrfToken = Cookies.get("csrftoken");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_BASE + "/");
        setTimePositions(response.data);
      } catch (error) {
        console.error("Ошибка загрузки позиций времени:", error);
      }
    };
    fetchData();
  }, []);

  const MAX_ROWS = 8;

  const handleChange = (index, value) => {
    const newPositions = [...timePositions];
    newPositions[index].time = value;
    setTimePositions(newPositions);
  };

  const handleAddRow = () => {
    if (timePositions.length < MAX_ROWS) {
      setTimePositions([...timePositions, { id: null, time: "" }]);
    }
  };

  const handleDeleteRow = async (index) => {
    const position = timePositions[index];
    if (position.id) {
      try {
        await axios.delete(`${API_BASE}/delete/${position.id}/`, {
          headers: { "X-CSRFTOKEN": csrfToken },
        });
      } catch (error) {
        console.error("Ошибка при удалении:", error);
      }
    }

    const newPositions = [...timePositions];
    newPositions.splice(index, 1);
    setTimePositions(newPositions);
  };

  const handleSave = async () => {
    let validPositions = [...timePositions].filter(pos => pos.time.trim());

    // Сортировка по началу времени
    validPositions.sort((a, b) => {
      const getStartMinutes = (timeStr) => {
        const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
        if (!match) return 0;
        const [, h, m] = match;
        return parseInt(h) * 60 + parseInt(m);
      };
      return getStartMinutes(a.time) - getStartMinutes(b.time);
    });

    for (const position of validPositions) {
      try {
        if (position.id) {
          await axios.put(`${API_BASE}/update/${position.id}/`, { time: position.time }, {
            headers: {
              "Content-Type": "application/json",
              "X-CSRFTOKEN": csrfToken,
            },
          });
        } else {
          const response = await axios.post(`${API_BASE}/create/`, { time: position.time }, {
            headers: {
              "Content-Type": "application/json",
              "X-CSRFTOKEN": csrfToken,
            },
          });
          position.id = response.data.id;
        }
      } catch (error) {
        console.error("Ошибка при сохранении:", error);
      }
    }

    setTimePositions(validPositions);
    //alert("Позиции времени отсортированы и сохранены!");
  };

  // Стили
  const thStyle = {
    padding: "10px",
    textAlign: "left",
    backgroundColor: "#f9f9f9",
    borderBottom: "1px solid #ddd",
    fontWeight: "600",
    fontSize: "14px",
  };

  const tdStyle = {
    padding: "10px",
    borderBottom: "1px solid #eee",
  };

  const inputStyle = {
    width: "100%",
    border: "none",
    background: "transparent",
    fontSize: "14px",
    padding: "0",
    margin: "0",
    color: "#333",
    outline: "none",
  };

  const inputHoverFocus = {
    backgroundColor: "#f0f8ff",
    borderRadius: "4px",
    padding: "4px",
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
                    Пользовательские настройки
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
                    Задайте свои настройки для автоматического планирования расписаний
                  </div>
                </div>
            </>
            
            <NavigationSettingsTabs />
      <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: "20px" }}>
        <thead>
          <tr>
            <th style={thStyle}>Позиция времени</th>
            <th style={{ ...thStyle, width: "40px" }}>Действие</th>
          </tr>
        </thead>
        <tbody>
          {timePositions.map((pos, index) => (
            <tr key={index}>
              <td style={tdStyle}>
                <input
                  type="text"
                  value={pos.time}
                  onChange={(e) => handleChange(index, e.target.value)}
                  placeholder="Введите время"
                  style={{ ...inputStyle }}
                  onFocus={(e) => Object.assign(e.target.style, inputHoverFocus)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                />
              </td>
              <td style={tdStyle}>
                <button
                  onClick={() => handleDeleteRow(index)}
                  style={{
                    color: "#d00",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    fontSize: "14px",
                  }}
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", gap: "10px" }}>
        {timePositions.length < MAX_ROWS && (
          <Button
            onClick={handleAddRow}
            variant="dark"
          >
            Добавить строку
          </Button>
        )}
        <Button
          onClick={handleSave}
          variant="dark"
        >
          Сохранить
        </Button>
      </div>
    </div>
  );
};

export default TimePositionsPage;

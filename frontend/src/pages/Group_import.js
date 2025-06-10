import React, { useState, useEffect } from "react";
import { Button } from 'react-bootstrap';
import NavigationTabs from './NavigationTabs';

const API_URL = process.env.REACT_APP_BACKEND_URL

// Получение CSRF токена из куки
const getCookie = (name) => {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

const EditableTable = () => {
  const [data, setData] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [programMap, setProgramMap] = useState({});

  // Получение программ при загрузке
  useEffect(() => {
    fetch(`${API_URL}/programs/`)
      .then((res) => res.json())
      .then((programsData) => {
        setPrograms(programsData);
        const codeToId = {};
        programsData.forEach((p) => {
          codeToId[p.code] = p.id;
        });
        setProgramMap(codeToId);
        if (programsData.length > 0) {
          setSelectedProgram(programsData[0].code);
        }
      });
  }, []);

  // Получение групп при изменении выбранной программы
  useEffect(() => {
    if (!selectedProgram || !programMap[selectedProgram]) return;

    fetch(`${API_URL}/groups/`)
      .then((res) => res.json())
      .then((groups) => {
        const filtered = groups.filter((g) => g.program === programMap[selectedProgram]);
        setData(filtered.map((g) => ({
          id: g.id,
          name: g.number,
          subject: g.year
        })));
      });
  }, [selectedProgram, programMap]);

  const handleChange = (id, field, value) => {
    setData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleAddRow = () => {
    setData((prev) => [...prev, { id: Date.now(), name: "", subject: "" }]);
  };

  const handleDeleteRow = async (id) => {
    const confirmed = window.confirm("Вы уверены, что хотите удалить эту группу?");
    if (!confirmed) return;

    const isNewRow = typeof id !== "number" || String(id).length > 10;

    if (!isNewRow) {
      try {
        const response = await fetch(`${API_URL}/groups/delete/${id}/`, {
          method: "DELETE",
          headers: {
            "X-CSRFTOKEN": getCookie("csrftoken")
          }
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error("Ошибка при удалении:", errText);
          alert("Не удалось удалить группу.");
          return;
        }
      } catch (error) {
        console.error("Ошибка сети:", error);
        alert("Ошибка сети при удалении.");
        return;
      }
    }

    setData((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSave = async () => {
    const programId = programMap[selectedProgram];

    const newGroups = data.filter((row) => typeof row.id !== "number" || String(row.id).length > 10);

    for (const row of newGroups) {
      try {
        const response = await fetch(`${API_URL}/groups/create/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFTOKEN": getCookie("csrftoken")
          },
          body: JSON.stringify({
            number: row.name,
            year: row.subject,
            program: programId
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error("Ошибка при сохранении:", errText);
          //alert("Не удалось сохранить строку: " + row.name);
        }
      } catch (error) {
        //console.error("Ошибка сети:", error);
        //alert("Ошибка сети при сохранении.");
      }
    }

    //alert("Сохранение завершено.");
  };

  const thStyle = {
    padding: "10px",
    textAlign: "left",
    backgroundColor: "#f9f9f9",
    borderBottom: "1px solid #ddd",
    fontWeight: "600",
    fontSize: "14px"
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
    borderBottom: "1px solid #ccc",
    background: "#fff",
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Segoe UI, sans-serif" }}>
      <>
                <div className="d-flex align-items-center justify-content-between w-50 mb-2 px-2" />
        
                <div className="d-flex align-items-center justify-content-between w-50 mb-0 px-2">
                  <div
                    className="m-0 text-wrap"
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      whiteSpace: 'normal'
                    }}
                  >
                    Проверка данных
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
                    Проверьте правильность ввода данных и заполните таблицу с группами
                  </div>
                </div>
            </>
        <NavigationTabs />

      <div className="program-segmented-control">
        {programs.map(({ code }) => {
          const isActive = selectedProgram === code;
          return (
            <div
              key={code}
              onClick={() => setSelectedProgram(code)}
              style={{
                alignItems: "center",
                padding: "4px 12px",
                borderRadius: "4px",
                height: "32px",
                backgroundColor: isActive ? "#ffffff" : "#f7f7f7",
                color: "#000",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex"
              }}
            >
              {code}
            </div>
          );
        })}
      </div>
    <br/><br/>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={thStyle}>Группа</th>
            <th style={thStyle}>Курс</th>
            <th style={thStyle}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td style={tdStyle}>
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => handleChange(row.id, "name", e.target.value)}
                  style={{ ...inputStyle }}
                  placeholder="Номер группы"
                  onFocus={(e) => Object.assign(e.target.style, inputHoverFocus)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                />
              </td>
              <td style={tdStyle}>
                <input
                  type="text"
                  value={row.subject}
                  onChange={(e) => handleChange(row.id, "subject", e.target.value)}
                  style={{ ...inputStyle }}
                  placeholder="Номер курса"
                  onFocus={(e) => Object.assign(e.target.style, inputHoverFocus)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                />
              </td>
              <td style={tdStyle}>
                <button
                  onClick={() => handleDeleteRow(row.id)}
                  style={{
                    color: "#d00",
                    cursor: "pointer",
                    background: "none",
                    border: "none"
                  }}
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
        <Button
          onClick={handleAddRow}
          variant="dark"
        >
          Добавить строку
        </Button>

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

export default EditableTable;

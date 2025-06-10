import React, { useEffect, useState } from 'react';
import NavigationTabs from './NavigationTabs';

const API_URL = process.env.REACT_APP_BACKEND_URL

const AuditoriumTable = () => {
  const [auditoriums, setAuditoriums] = useState([]);
  const [buildings, setBuildings] = useState({});
  const [buildingsList, setBuildingsList] = useState([]);
  const [departments, setDepartments] = useState({});
  const [selectedBuilding, setSelectedBuilding] = useState(null); // добавлено
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  useEffect(() => {
    fetch(`${API_URL}/auditoriums/`)
      .then(res => res.json())
      .then(setAuditoriums);

    fetch(`${API_URL}/buildings/`)
      .then(res => res.json())
      .then(data => {
        const buildingMap = {};
        data.forEach(b => {
          buildingMap[b.id] = b.name;
        });
        setBuildings(buildingMap);
        setBuildingsList(data);
        if (data.length > 0) {
            setSelectedBuilding(data[0].id); // установка первого здания по умолчанию
        }
      });

    fetch(`${API_URL}/departments/`)
      .then(res => res.json())
      .then(data => {
        const deptMap = {};
        data.forEach(d => {
          deptMap[d.id] = d.department_code;
        });
        setDepartments(deptMap);
      });
  }, []);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      } else {
        return { key, direction: 'asc' };
      }
    });
  };

  const filteredAuditoriums = selectedBuilding
    ? auditoriums.filter(a => a.building === selectedBuilding)
    : auditoriums;

  const sortedAuditoriums = [...filteredAuditoriums].sort((a, b) => {
    const aVal = a[sortConfig.key] ?? '';
    const bVal = b[sortConfig.key] ?? '';
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const tableStyle = {
    borderCollapse: 'collapse',
    width: '100%',
    marginTop: '20px',
  };

  const thStyle = {
    padding: '8px 12px',
    textAlign: 'left',
    backgroundColor: '#f0f0f0',
    borderBottom: '2px solid #ddd',
    cursor: 'pointer',
  };

  const tdStyle = {
    padding: '8px 12px',
    borderBottom: '1px solid #eee',
  };

  const getHeaderStyle = (key) => ({
    ...thStyle,
    color: sortConfig.key === key ? 'gray' : 'black',
    fontWeight: 'bold',
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif' }}>
      <div>
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

        {/* Кликабельные здания */}
        <div className="program-segmented-control">
          {buildingsList.map(b => {
            const isActive = selectedBuilding === b.id;
            return (
              <div
                key={b.id}
                onClick={() => setSelectedBuilding(b.id)}
                style={{
                  alignItems: 'center',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  height: '32px',
                  backgroundColor: isActive ? '#ffffff' : '#f7f7f7',
                  color: '#000',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                {b.name === "Old" ? "Старый корпус": b.name === "New" ? "Новый корпус" : b.name === "Frezer" ? "Фрезер" : "Стадион"}
              </div>
            );
          })}
        </div>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={getHeaderStyle('name')} onClick={() => handleSort('name')}>Номер</th>
              <th style={getHeaderStyle('type')} onClick={() => handleSort('type')}>Тип аудитории</th>
              <th style={getHeaderStyle('size')} onClick={() => handleSort('size')}>Размер лекционной</th>
              <th style={getHeaderStyle('department_code')} onClick={() => handleSort('department_code')}>Код кафедры</th>
            </tr>
          </thead>
          <tbody>
            {sortedAuditoriums.map((a) => (
              <tr key={a.id}>
                <td style={tdStyle}>{a.name}</td>
                <td style={tdStyle}>
                  {a.type === "Laboratory" ? "Лабораторная" :
                   a.type === "Lection" ? "Лекционная" :
                   a.type === "Seminar" ? "Практическая" :
                   "Спортивный зал"}
                </td>
                <td style={tdStyle}>
                  {a.size === "small" ? "маленькая" : a.size === "big" ? "большая" : ""}
                </td>
                <td style={tdStyle}>
                  {a.department_code != null ? departments[a.department_code] ?? a.department_code : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditoriumTable;

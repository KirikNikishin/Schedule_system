import React, { useEffect, useState } from 'react';
import NavigationTabs from './NavigationTabs';

const API_URL = process.env.REACT_APP_BACKEND_URL

const TeacherImport = () => {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState({});
  const [subjects, setSubjects] = useState({});
  const [selectedCode, setSelectedCode] = useState(20);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  const deptCodes = Array.from({ length: 35 }, (_, i) => i + 1);

  useEffect(() => {
    fetch(`${API_URL}/teachers/`)
      .then(res => res.json())
      .then(setTeachers);

    fetch(`${API_URL}/departments/`)
      .then(res => res.json())
      .then(data => {
        const map = {};
        data.forEach(dep => {
          map[dep.id] = dep.department_code;
        });
        setDepartments(map);
      });

    fetch(`${API_URL}/subjects/`)
      .then(res => res.json())
      .then(data => {
        const map = {};
        data.forEach(sub => {
          map[sub.id] = sub.name;
        });
        setSubjects(map);
      });
  }, []);

  const handleSelect = (code) => {
    setSelectedCode(code);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredTeachers = teachers
    .filter(t => departments[t.department_code] === selectedCode)
    .sort((a, b) => {
      if (!sortField) return 0;
      let aValue, bValue;
      switch (sortField) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'department':
          aValue = departments[a.department_code] ?? '';
          bValue = departments[b.department_code] ?? '';
          break;
        case 'subject':
          aValue = subjects[a.subject] ?? '';
          bValue = subjects[b.subject] ?? '';
          break;
        default:
          return 0;
      }
      if (typeof aValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

  const getHeaderStyle = (field) => ({
    ...thStyle,
    color: sortField === field ? '#888' : '#000',
    cursor: 'pointer'
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif' }}>
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

      <div
        style={{
          overflowX: 'auto',
          marginBottom: '16px',
        }}
        className="custom-scrollbar"
      >
        <div
          className='program-segmented-control'
          style={{
            display: 'flex',
            whiteSpace: 'nowrap',
            paddingBottom: '4px',
            minWidth: 'max-content',
          }}
        >
          {deptCodes.map(code => {
            const isActive = selectedCode === code;
            return (
              <div
                key={code}
                onClick={() => handleSelect(code)}
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
                  whiteSpace: 'nowrap',
                }}
              >
                {code}
              </div>
            );
          })}
        </div>
      </div>

      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          fontFamily: 'Segoe UI, sans-serif',
        }}
      >
        <thead>
          <tr>
            <th style={getHeaderStyle('id')} onClick={() => handleSort('id')}>Код</th>
            <th style={getHeaderStyle('name')} onClick={() => handleSort('name')}>Фамилия И.О.</th>
            <th style={getHeaderStyle('subject')} onClick={() => handleSort('subject')}>Предмет</th>
          </tr>
        </thead>
        <tbody>
          {filteredTeachers.map(t => (
            <tr key={t.id}>
              <td style={tdStyle}>{t.id}</td>
              <td style={tdStyle}>{t.name}</td>
              <td style={tdStyle}>{subjects[t.subject] ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 45px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #000;
          border-radius: 45px;
        }

        .custom-scrollbar {
          scrollbar-color:rgba(0, 0, 0, 0.67) transparent;
          scrollbar-width: thin;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

const thStyle = {
  padding: '8px 12px',
  textAlign: 'left',
  backgroundColor: '#f0f0f0',
  borderBottom: '2px solid #ddd',
};

const tdStyle = {
  padding: '8px 12px',
  borderBottom: '1px solid #eee',
};

export default TeacherImport;

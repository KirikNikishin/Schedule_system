import React from 'react';
import { Button } from 'react-bootstrap';
import './NavigationScheduleTabs.css';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL
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

const NavigationScheduleEditTabs = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleClick = () => {
        const currentPath = location.pathname; // например, /generate/group
        const newPath = currentPath.replace("/generate", "/edit");
        navigate(newPath);
    };

    const tabs = [
        { label: 'Группа', path: '/edit/group' },
        { label: 'Преподаватель', path: '/edit/teacher' },
        { label: 'Аудитория', path: '/edit/auditorium' },
    ];

    return (
        <div className="navigation-wrapper">
        <div className="segmented-schedule-control">
            {tabs.map(({ label, path }, index) => (
            <NavLink
                key={index}
                to={path}
                className={({ isActive }) =>
                `tab-item ${isActive ? 'active-tab' : ''} ${label === 'Группы' ? 'highlighted-tab' : ''}`
                }
            >
                {label}
            </NavLink>
            ))}
        </div>
        <div alignItems="right">
            <Button alignItems="right" variant="dark" onClick={() => handleExportSchedule("ИДБ-21-09")}>Экспорт в PDF</Button>
        </div>
        </div>
    );
};

export default NavigationScheduleEditTabs;

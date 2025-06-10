import React from 'react';
import { Button } from 'react-bootstrap';
import './NavigationTabs.css';
import { NavLink } from 'react-router-dom';


const NavigationTabs = () => {
  const tabs = [
    { label: 'Кафедры', path: '/import/department' },
    { label: 'Направления', path: '/import/direction' },
    { label: 'Дисциплины', path: '/import/subject' },
    { label: 'Аудитории', path: '/import/auditorium' },
    { label: 'Преподаватели', path: '/import/teacher' },
    { label: 'Типы занятий', path: '/import/type' },
    { label: 'Учебный план', path: '/import/study_plan' },
    { label: 'Группы', path: '/import/group' },
    ];

  return (
    <div className="navigation-wrapper">
      <div className="segmented-control">
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
      <Button alignItems="right" variant="dark" href='/settings/user'>Далее</Button>
    </div>
  );
};

export default NavigationTabs;
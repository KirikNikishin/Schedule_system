import React from 'react';
import { Button } from 'react-bootstrap';
import './NavigationSettingsTabs.css';
import { NavLink } from 'react-router-dom';


const NavigationSettingsTabs = () => {
  const tabs = [
    { label: 'Настройки', path: '/settings/user' },
    { label: 'Позиции времени', path: '/settings/time' },

    ];

  return (
    <div className="navigation-wrapper">
      <div className="segmented-settings-control">
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
      <Button alignItems="right" variant="dark" href='/generate/group'>Далее</Button>
    </div>
  );
};

export default NavigationSettingsTabs;

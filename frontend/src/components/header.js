import React, { Component } from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { NavLink, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css'; // для кастомных стилей, если нужно

function MyImportNavLink(props) {
  const location = useLocation();
  const active = location.pathname.includes('import');
  
  return (
    <NavLink
      {...props}
      className={'nav-link' + (active ? ' active' : '')}
    />
  );
}

function MySettingsNavLink(props) {
  const location = useLocation();
  const active = location.pathname.includes('settings');
  
  return (
    <NavLink
      {...props}
      className={'nav-link' + (active ? ' active' : '')}
    />
  );
}

function MyGenerateNavLink(props) {
  const location = useLocation();
  const active = location.pathname.includes('generate');
  
  return (
    <NavLink
      {...props}
      className={'nav-link' + (active ? ' active' : '')}
    />
  );
}

function MyEditNavLink(props) {
  const location = useLocation();
  const active = location.pathname.includes('edit');
  
  return (
    <NavLink
      {...props}
      className={'nav-link' + (active ? ' active' : '')}
    />
  );
}

export default class Header extends Component {
  render() {
    return (
      <>
        <div
          style={{
            height: '100vh',
            width: '260px',
            position: 'fixed',
            top: 0,
            left: 0,
            backgroundColor: '#f8f9fa',
            borderRight: '1px solid #dee2e6',
            padding: '1rem',
          }}
        >
          <Navbar
            bg="light"
            variant="light"
            className="flex-column align-items-start w-100 p-0"
          >
            <div className="d-flex align-items-center justify-content-between w-100 mb-3 px-2">
              <Navbar.Brand
                as={NavLink}
                to="/"
                className="m-0 text-wrap"
                style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  maxWidth: '150px',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                }}
              >
                Планирование расписаний
              </Navbar.Brand>
            </div>

            {/* Заголовки */}
            <div className="d-flex align-items-center justify-content-between w-100 mb-2 px-2"></div>

            <div className="d-flex align-items-center justify-content-between w-100 mb-0 px-2">
              <Navbar.Brand
                className="m-0 text-wrap"
                style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  maxWidth: '150px',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                }}
              >
                Шаги
              </Navbar.Brand>
            </div>

            <div className="d-flex align-items-center justify-content-between w-100 mb-0 px-2">
              <Navbar.Brand
                className="m-0 text-wrap"
                style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  maxWidth: '150px',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                }}
              >
                Учебный план
              </Navbar.Brand>
            </div>

            {/* Навигационные ссылки */}
            <Nav className="flex-column w-100 px-2">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  'nav-link' + (isActive ? ' active' : '')
                }
              >
                Импорт данных
              </NavLink>
              <MyImportNavLink to="/import/department">
                Загрузка в БД
              </MyImportNavLink>
              <MySettingsNavLink to="/settings/user">
                Пользовательские настройки
              </MySettingsNavLink>
            </Nav>

            <div className="d-flex align-items-center justify-content-between w-100 mb-3 px-2" />

            <div className="d-flex align-items-center justify-content-between w-100 mb-0 px-2">
              <Navbar.Brand
                className="m-0 text-wrap"
                style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  maxWidth: '150px',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                }}
              >
                Расписание
              </Navbar.Brand>
            </div>

            <Nav className="flex-column w-100 px-2">
              <MyGenerateNavLink to="/generate/group">
                Составление расписания
              </MyGenerateNavLink>
              <MyEditNavLink to="/edit/group">
                Редактирование расписания
              </MyEditNavLink>
            </Nav>
          </Navbar>
        </div>
      </>
    );
  }
}

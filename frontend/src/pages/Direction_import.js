import React, { Component } from 'react';
import NavigationTabs from './NavigationTabs';

const API_URL = process.env.REACT_APP_BACKEND_URL

export default class Direction_import extends Component {
  constructor(props) {
    super(props);
    this.state = {
      programs: {},
      isLoaded: false,
      error: null,
      sortConfig: { key: null, direction: 'asc' },
    };
  }

  componentDidMount() {
    fetch(`${API_URL}/programs/`)
      .then(res => res.json())
      .then(programs => {
        this.setState({
          programs: Object.fromEntries(programs.map(p => [p.id, p.code])),
          isLoaded: true,
        });
      })
      .catch(error => {
        this.setState({ error, isLoaded: true });
      });
  }

  handleSort = (key) => {
    this.setState((prevState) => {
      let direction = 'asc';
      if (prevState.sortConfig.key === key && prevState.sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      return { sortConfig: { key, direction } };
    });
  };

  getSortedDepartments = () => {
    const { programs, sortConfig } = this.state;

    // Преобразуем объект в массив для сортировки
    let entries = Object.entries(programs); // [ [id, department_code], ... ]

    if (!sortConfig.key) return entries;

    entries.sort((a, b) => {
      const [aId, aCode] = a;
      const [bId, bCode] = b;

      if (sortConfig.key === 'id') {
        return sortConfig.direction === 'asc' ? aId - bId : bId - aId;
      } else if (sortConfig.key === 'department_code') {
        return sortConfig.direction === 'asc'
          ? String(aCode).localeCompare(String(bCode), 'ru')
          : String(bCode).localeCompare(String(aCode), 'ru');
      }
      return 0;
    });

    return entries;
  };

  render() {
    const { error, isLoaded, sortConfig } = this.state;

    if (error) {
      return <div>Ошибка: {error.message}</div>;
    }

    if (!isLoaded) {
      return <p>Загрузка...</p>;
    }

    const programs = this.getSortedDepartments();

    const thStyle = {
      padding: '12px 16px',
      backgroundColor: '#f4f4f4',
      textAlign: 'left',
      borderBottom: '1px solid #ccc',
      fontWeight: 'bold',
      cursor: 'pointer',
    };

    const tdStyle = {
      padding: '12px 16px',
      borderBottom: '1px solid #eee',
    };

    const getHeaderStyle = (key) =>
      sortConfig.key === key ? { ...thStyle, color: 'gray' } : thStyle;

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
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={getHeaderStyle('id')} onClick={() => this.handleSort('id')}>ID</th>
              <th style={getHeaderStyle('department_code')} onClick={() => this.handleSort('department_code')}>Код направления</th>
            </tr>
          </thead>
          <tbody>
            {programs.map(([id, code]) => (
              <tr key={id}>
                <td style={tdStyle}>{id}</td>
                <td style={tdStyle}>{code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

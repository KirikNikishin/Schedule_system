import React, { Component } from 'react';
import NavigationTabs from './NavigationTabs';
import './NavigationTabs.css';

const API_URL = process.env.REACT_APP_BACKEND_URL

export default class Subject_import extends Component {
  constructor(props) {
    super(props);
    this.state = {
      subjects: [],
      departments: {},
      programs: [],
      selectedProgramId: null,
      isLoaded: false,
      error: null,
      sortConfig: { key: null, direction: 'asc' },
    };
  }

  componentDidMount() {
    Promise.all([
      fetch(`${API_URL}/subjects/`).then((res) => res.json()),
      fetch(`${API_URL}/departments/`).then((res) => res.json()),
      fetch(`${API_URL}/programs/`).then((res) => res.json()),
    ])
      .then(([subjects, departments, programs]) => {
        const departmentMap = Object.fromEntries(
          departments.map((d) => [d.id, d.department_code])
        );
        this.setState({
          subjects,
          departments: departmentMap,
          programs,
          selectedProgramId: programs.length > 0 ? programs[0].id : null,
          isLoaded: true,
        });
      })
      .catch((error) => {
        this.setState({ error, isLoaded: true });
      });
  }

  handleSort = (key) => {
    this.setState((prevState) => {
      let direction = 'asc';
      if (
        prevState.sortConfig.key === key &&
        prevState.sortConfig.direction === 'asc'
      ) {
        direction = 'desc';
      }
      return { sortConfig: { key, direction } };
    });
  };

  handleProgramSelect = (id) => {
    this.setState({ selectedProgramId: id });
  };

  getFilteredAndSortedSubjects = () => {
    const { subjects, selectedProgramId, sortConfig, departments } = this.state;

    const filtered = selectedProgramId
      ? subjects.filter((subject) => subject.program === selectedProgramId)
      : subjects;

    const sorted = [...filtered];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const getVal = (item) =>
          sortConfig.key === 'department_code'
            ? departments[item.department]
            : item[sortConfig.key];

        const aVal = getVal(a);
        const bVal = getVal(b);

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        return sortConfig.direction === 'asc'
          ? String(aVal).localeCompare(String(bVal), 'ru')
          : String(bVal).localeCompare(String(aVal), 'ru');
      });
    }

    return sorted;
  };

  render() {
    const {
      error,
      isLoaded,
      departments,
      programs,
      selectedProgramId,
      sortConfig,
    } = this.state;

    if (error) {
      return <div>Ошибка: {error.message}</div>;
    }

    if (!isLoaded) {
      return <p>Загрузка...</p>;
    }

    const sortedSubjects = this.getFilteredAndSortedSubjects();

    const getHeaderStyle = (key) =>
      sortConfig.key === key
        ? { ...thStyle, color: 'gray', cursor: 'pointer' }
        : { ...thStyle, cursor: 'pointer' };

    return (
      <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif' }}>
        <div className="d-flex align-items-center justify-content-between w-50 mb-0 px-2">
          <div
            className="m-0 text-wrap"
            style={{ fontSize: '1.5rem', fontWeight: 'bold', whiteSpace: 'normal' }}
          >
            Проверка данных
          </div>
        </div>

        <div className="d-flex align-items-center w-30 mb-0 px-2">
          <div
            className="m-0 text-wrap"
            style={{ color: 'gray', whiteSpace: 'normal' }}
          >
            Проверьте правильность ввода данных и заполните таблицу с группами
          </div>
        </div>

        <NavigationTabs />

        <div style={{ display: "inline-flex", borderRadius: "8px", padding: "4px", background: "#f7f7f7" }}>
          {programs.map(({ id, code }) => {
            const isActive = selectedProgramId === id;
            return (
              <div
                key={id}
                onClick={() => this.handleProgramSelect(id)}
                style={{
                  alignItems: 'center',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  height: '32px',
                  backgroundColor: isActive ? '#ffffff' : '#f7f7f7',
                  color: '#000',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {code}
              </div>
            );
          })}
        </div>
        <br/><br/>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={getHeaderStyle('id')} onClick={() => this.handleSort('id')}>ID</th>
                <th style={getHeaderStyle('name')} onClick={() => this.handleSort('name')}>Название предмета</th>
                <th style={getHeaderStyle('department_code')} onClick={() => this.handleSort('department_code')}>Код кафедры</th>
                <th style={getHeaderStyle('semester')} onClick={() => this.handleSort('semester')}>Номер семестра</th>
              </tr>
            </thead>
            <tbody>
              {sortedSubjects.map((subject) => (
                <tr key={subject.id}>
                  <td style={tdStyle}>{subject.id}</td>
                  <td style={tdStyle}>{subject.name}</td>
                  <td style={tdStyle}>{departments[subject.department_code] ?? '—'}</td>
                  <td style={tdStyle}>{subject.semester}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

// --- Стили ---
const tableStyle = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
};

const thStyle = {
  padding: '12px 16px',
  backgroundColor: '#f4f4f4',
  textAlign: 'left',
  borderBottom: '1px solid #ccc',
  fontWeight: 'bold',
};

const tdStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid #eee',
};

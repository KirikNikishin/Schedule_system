import React, { Component } from 'react';
import NavigationTabs from './NavigationTabs';
import PeriodTabs from './PeriodTabs';
import ProgramTabs from './ProgramTabs';

const API_URL = process.env.REACT_APP_BACKEND_URL

export default class Study_plan_import extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lessons: [],
      subjects: {},
      departments: {},
      teachers: {},
      types: {},
      programs: {},
      isLoaded: false,
      error: null,
      sortConfig: { key: null, direction: 'asc' },
      programCodeFilter: '',
      selectedSemester: 1,
    };
  }

  componentDidMount() {
    Promise.all([
      fetch(`${API_URL}/lessons/`).then(res => res.json()),
      fetch(`${API_URL}/subjects/`).then(res => res.json()),
      fetch(`${API_URL}/teachers/`).then(res => res.json()),
      fetch(`${API_URL}/typelessons/`).then(res => res.json()),
      fetch(`${API_URL}/departments/`).then(res => res.json()),
      fetch(`${API_URL}/programs/`).then(res => res.json()),
    ])
      .then(([lessons, subjects, teachers, types, departments, programs]) => {
        this.setState({
          lessons,
          subjects: Object.fromEntries(
            subjects.map(s => [s.id, { name: s.name, department: s.department_code, program: s.program, semester: s.semester }])
          ),
          departments: Object.fromEntries(departments.map(d => [d.id, d.department_code])),
          teachers: Object.fromEntries(teachers.map(t => [t.id, t.name])),
          types: Object.fromEntries(types.map(t => [t.id, t.name])),
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

  getSortedLessons = () => {
    const { lessons, subjects, types, teachers, departments, programs, sortConfig, programCodeFilter, selectedSemester } = this.state;
    let filteredLessons = [...lessons];

    if (programCodeFilter) {
      filteredLessons = filteredLessons.filter(lesson => {
        const subject = subjects[lesson.subject];
        if (!subject) return false;
        const programCode = programs[subject.program];
        return programCode === programCodeFilter;
      });
    }

    if (selectedSemester) {
      filteredLessons = filteredLessons.filter(lesson => {
        const subject = subjects[lesson.subject];
        return subject?.semester === selectedSemester;
      });
    }

    if (!sortConfig.key) return filteredLessons;

    filteredLessons.sort((a, b) => {
      const key = sortConfig.key;

      const getValue = (lesson) => {
        switch (key) {
          case 'id':
          case 'number':
            return lesson[key];
          case 'subject':
            return subjects[lesson.subject]?.name || '';
          case 'type':
            const t = types[lesson.lesson_type];
            return t === 'Lection' ? 'Лекции' : t === 'Seminar' ? 'Семинары' : t === 'Lab' ? 'Лаб. раб.' : '';
          case 'teacher':
            return teachers[lesson.teachers];
          case 'department':
            const deptId = subjects[lesson.subject]?.department;
            return departments[deptId] ?? 0;
          case 'program':
            const progId = subjects[lesson.subject]?.program;
            return programs[progId] || '';
          default:
            return '';
        }
      };

      const aVal = getValue(a);
      const bVal = getValue(b);

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return sortConfig.direction === 'asc'
        ? String(aVal).localeCompare(String(bVal), 'ru')
        : String(bVal).localeCompare(String(aVal), 'ru');
    });

    return filteredLessons;
  };

  render() {
    const {
      error, isLoaded, subjects, departments, teachers,
      types, programs, sortConfig, programCodeFilter, selectedSemester
    } = this.state;

    if (error) {
      return <div>Ошибка: {error.message}</div>;
    }

    if (!isLoaded) {
      return <p>Загрузка...</p>;
    }

    const lessons = this.getSortedLessons();

    const getHeaderStyle = (key) =>
      sortConfig.key === key ? { ...thStyle, color: 'gray', cursor: 'pointer' } : { ...thStyle, cursor: 'pointer' };

    return (
      <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif' }}>
        <>
          <div className="d-flex align-items-center justify-content-between w-50 mb-2 px-2" />

          <div className="d-flex align-items-center justify-content-between w-50 mb-0 px-2">
            <div
              className="m-0 text-wrap"
              style={{ fontSize: '1.5rem', fontWeight: 'bold', whiteSpace: 'normal' }}>
              Проверка данных
            </div>
          </div>

          <div className="d-flex align-items-center w-30 mb-0 px-2">
            <div className="m-0 text-wrap" style={{ color: 'gray', whiteSpace: 'normal' }}>
              Проверьте правильность ввода данных и заполните таблицу с группами
            </div>
          </div>
        </>
        <NavigationTabs />
        <PeriodTabs selectedSemester={selectedSemester} onSelect={(num) => this.setState({ selectedSemester: num })} />
        <ProgramTabs
          programs={programs}
          selected={programCodeFilter}
          onSelect={(code) => this.setState({ programCodeFilter: code })}
        />
        <br /><br />
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={getHeaderStyle('id')} onClick={() => this.handleSort('id')}>Код занятия</th>
                <th style={getHeaderStyle('subject')} onClick={() => this.handleSort('subject')}>Название предмета</th>
                <th style={getHeaderStyle('type')} onClick={() => this.handleSort('type')}>Тип занятия</th>
                <th style={getHeaderStyle('number')} onClick={() => this.handleSort('number')}>Количество занятий</th>
                <th style={getHeaderStyle('teacher')} onClick={() => this.handleSort('teacher')}>Преподаватели</th>
                <th style={getHeaderStyle('department')} onClick={() => this.handleSort('department')}>Код кафедры</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => {
                const subject = subjects[lesson.subject];
                const departmentCode = subject ? departments[subject.department] : '—';

                return (
                  <tr key={lesson.id} style={{ ...getRowStyle(types[lesson.lesson_type]), transition: 'background-color 0.2s ease' }}>
                    <td style={tdStyle}>{lesson.id}</td>
                    <td style={tdStyle}>{subject?.name || '—'}</td>
                    <td style={tdStyle}>
                      {
                        types[lesson.lesson_type] === "Lection" ? "Лекции" :
                        types[lesson.lesson_type] === "Seminar" ? "Семинары" :
                        types[lesson.lesson_type] === "Lab" ? "Лаб. раб." :
                        types[lesson.lesson_type] || '—'
                      }
                    </td>
                    <td style={tdStyle}>{lesson.number}</td>
                    <td style={tdStyle}>
                      {lesson.teachers
                        ? (Array.isArray(lesson.teachers)
                          ? lesson.teachers.map(id => teachers[id] || '—').join(', ')
                          : teachers[lesson.teachers] || '—')
                        : '—'}
                    </td>
                    <td style={tdStyle}>{departmentCode}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

// --- styles ---
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

const getRowStyle = (typeName) => {
  switch (typeName) {
    case 'Lection':
      return { backgroundColor: '#fff9c4' };
    case 'Seminar':
      return { backgroundColor: '#c8e6c9' };
    case 'Lab':
      return { backgroundColor: '#e1bee7' };
    default:
      return {};
  }
};

// Add hover style
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  tr:hover td {
    background-color: #e6f7ff !important;
  }
`, styleSheet.cssRules.length);

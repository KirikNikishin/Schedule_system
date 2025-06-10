import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import Header from './components/header';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Study_plan_import from './pages/Study_plan_import';
import Department_import from './pages/Department_import';
import Auditorium_import from './pages/Auditorium_import';
import Direction_import from './pages/Direction_import';
import Type_lesson_import from './pages/Type_lesson_import';
import Subject_import from './pages/Subject_import';
import Teacher_import from './pages/Teacher_import';
import Group_import from './pages/Group_import';
import User_settings from './pages/User_settings';
import Time_settings from './pages/Time_settings';
import Group_watch_schedule from './pages/Group_watch_schedule';
import Teacher_watch_schedule from './pages/Teacher_watch_schedule';
import Auditorium_watch_schedule from './pages/Auditorium_watch_schedule';
import Group_edit_schedule from './pages/Group_edit_schedule';
import Teacher_edit_schedule from './pages/Teacher_edit_schedule';
import Auditorium_edit_schedule from './pages/Auditorium_edit_schedule';
import Export from './pages/Export'
//import Test from './pages/Study_plan_import';

function App() {
  return (
    <Router>
      <Header />
      <div style={{ marginLeft: '260px', padding: '1rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/import/department" element={<Department_import />} />
          <Route path="/import/direction" element={<Direction_import />} />
          <Route path="/import/subject" element={<Subject_import />} />
          <Route path="/import/auditorium" element={<Auditorium_import />} />
          <Route path="/import/type" element={<Type_lesson_import />} />
          <Route path="/import/study_plan" element={<Study_plan_import />} />
          <Route path='/import/teacher' element={<Teacher_import />} />
          <Route path='/import/group' element={<Group_import />} />
          <Route path='/settings/user' element={<User_settings />} />
          <Route path='/settings/time' element={<Time_settings />} />
          <Route path='/generate/group' element={<Group_watch_schedule />} />
          <Route path='/generate/teacher' element={<Teacher_watch_schedule />} />
          <Route path='/generate/auditorium' element={<Auditorium_watch_schedule />} />
          <Route path='/edit/group' element={<Group_edit_schedule />} />
          <Route path='/edit/teacher' element={<Teacher_edit_schedule />} />
          <Route path='/edit/auditorium' element={<Auditorium_edit_schedule />} />
          <Route path='/export' element={<Export />} />
          {/* <Route path="/test" element={<Test />} /> */}
          
        </Routes>
      </div>
    </Router>

  );
}

export default App;

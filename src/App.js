import {BrowserRouter, Routes, Route}from 'react-router-dom';
import Login from './Components/Assets/LoginSignUp/LoginSignup';
import Dashboard from './Components/Dashboard/Dashboard';
import TaskList from './Components/TaskList/TaskList';

function App() { //paths for links instead of hrefs
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<TaskList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


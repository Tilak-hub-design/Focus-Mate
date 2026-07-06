import {BrowserRouter, Routes, Route}from 'react-router-dom';
import Login from './Components/Assets/LoginSignUp/LoginSignup';
import Dashboard from './Components/Dashboard/Dashboard';

function App() { //paths for links instead of hrefs
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


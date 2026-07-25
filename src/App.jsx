import React, { useEffect, useState } from "react";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import TasksPage from "./pages/TasksPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MoodPage from "./pages/MoodPage";
import FocusPage from "./pages/FocusPage";
import { loadUsers } from "./utils/storage";

export default function App() {
  const [route, setRoute] = useState(sessionStorage.getItem("fm_route") || "login");
  const [user, setUser] = useState(sessionStorage.getItem("fm_session") || null);

  function go(r) {
    sessionStorage.setItem("fm_route", r);
    setRoute(r);
  }

  function onLogin(username) {
    // ensure sessionStorage is set by login flow; update local state
    try {
      sessionStorage.setItem("fm_session", username);
    } catch {}
    setUser(username);
    go("dashboard");
  }

  function onLogout() {
    sessionStorage.removeItem("fm_session");
    sessionStorage.removeItem("fm_key");
    sessionStorage.removeItem("fm_user_data");
    setUser(null);
    go("login");
  }

  // keep users snapshot for pages
  const users = loadUsers();

  // keep App user in sync with sessionStorage (helps multi-tab and ensures UI follows session)
  useEffect(() => {
    function onStorage(e) {
      if (e.key === "fm_session") {
        setUser(sessionStorage.getItem("fm_session"));
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <div className="app">
      <Header user={user} go={go} onLogout={onLogout} />
      <main className="main">
        {route === "login" && <Login onLogin={onLogin} goRegister={() => go("register")} />}
        {route === "register" && <Register onRegister={onLogin} goLogin={() => go("login")} />}
        {route === "dashboard" && user && <Dashboard user={user} go={go} users={users} />}
        {route === "tasks" && user && <TasksPage user={user} go={go} />}
        {route === "mood" && user && <MoodPage user={user} go={go} />}
        {route === "focus" && user && <FocusPage user={user} go={go} />}
        {!user && route !== "login" && route !== "register" && (
          <div className="card">Please log in to continue.</div>
        )}
      </main>
    </div>
  );
}

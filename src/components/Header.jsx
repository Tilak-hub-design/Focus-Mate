import React, { useState, useRef, useEffect } from "react";

/**
 * Header
 * Props:
 *  - user: username string or null
 *  - go: navigation function (e.g., go("dashboard"))
 *  - onLogout: logout callback
 */
export default function Header({ user, go, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <header className="nav">
      <div className="nav-left">
        <h2
          className="nav-title"
          style={{ cursor: "pointer" }}
          onClick={() => go && go("dashboard")}
        >
          FocusMate
        </h2>
      </div>

      <div className="nav-right">
        {user ? (
          <>
            <nav className="nav-links" aria-label="Primary">
              <button className="link-btn" onClick={() => go && go("dashboard")}>Dashboard</button>
              <button className="link-btn" onClick={() => go && go("tasks")}>Tasks</button>
              <button className="link-btn" onClick={() => go && go("focus")}>Focus</button>
              <button className="link-btn" onClick={() => go && go("mood")}>Mood</button>
            </nav>

            <div className="user-dropdown" ref={ref}>
              <button className="user-btn" onClick={() => setOpen((v) => !v)} aria-haspopup="true" aria-expanded={open}>
                {user}
              </button>
              {open && (
                <div className="dropdown" role="menu">
                  <button onClick={onLogout}>Logout</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button className="link-btn" onClick={() => go && go("login")}>Login</button>
            <button className="link-btn" onClick={() => go && go("register")}>Register</button>
          </>
        )}
      </div>
    </header>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { loadUsers, loadUsersRaw, saveUsers } from "../utils/storage";

function formatTime(sec) {
  const s = sec % 60;
  const m = Math.floor((sec % 3600) / 60);
  const h = Math.floor(sec / 3600);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function dateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
function sessionKey(user) {
  return `fm_focus_session_${user}`;
}

export default function FocusPage({ user, go }) {
  const [running, setRunning] = useState(false);
  const [accumulated, setAccumulated] = useState(0); // seconds accumulated in this session (not yet committed)
  const startRef = useRef(null); // timestamp when current running interval started
  const tickRef = useRef(null);
  const [users, setUsers] = useState(loadUsers());
  const [, setTick] = useState(0); // used to force re-render every second while running

  useEffect(() => setUsers(loadUsers()), [user]);

  if (!user) {
    return (
      <div className="card">
        <h2>Focus Mode</h2>
        <p>You are not signed in. Please log in to use Focus Mode.</p>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => go && go("login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  // restore session from sessionStorage if present
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(sessionKey(user));
      if (raw) {
        const obj = JSON.parse(raw);
        setAccumulated(obj.accumulated || 0);
        if (obj.running && obj.startTs) {
          // resume running session
          startRef.current = obj.startTs;
          setRunning(true);
          tickRef.current = setInterval(() => setTick((t) => t + 1), 1000);
        } else {
          // paused session: keep accumulated so UI shows paused total
          setRunning(false);
        }
      }
    } catch {
      // ignore parse errors
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    persistSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, accumulated]);

  useEffect(() => {
    function onBeforeUnload() {
      persistSession();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, accumulated]);

  function persistSession() {
    const obj = {
      running,
      accumulated,
      startTs: running ? startRef.current : null,
    };
    try {
      sessionStorage.setItem(sessionKey(user), JSON.stringify(obj));
    } catch {
      // ignore
    }
  }

  /**
   * Start / Pause behavior:
   * - Start: begin a running interval, keep any previously accumulated seconds (do not reset).
   * - Pause: stop the running interval and add the elapsed seconds to `accumulated` so the UI shows the paused total.
   *   Do NOT commit accumulated time to persistent storage on pause. Committing is an explicit action (Save Session).
   */
  function handleStartPause() {
    if (!running) {
      // start or resume: mark start timestamp and begin ticking
      startRef.current = Date.now();
      setRunning(true);
      tickRef.current = setInterval(() => setTick((t) => t + 1), 1000);
      persistSession();
      return;
    }

    // pause: stop ticking and accumulate elapsed seconds locally (do not save to focusByDate)
    if (running) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      const seconds = Math.floor((Date.now() - startRef.current) / 1000);
      setAccumulated((prev) => prev + seconds);
      startRef.current = null;
      setRunning(false);
      // persistSession effect will run and save the paused snapshot
    }
  }

  /**
   * saveSession
   * - Commits the current accumulated time (including any running interval) to persistent storage (focusByDate).
   * - After saving, clears the accumulated counter and stops any running interval.
   */
  function saveSession() {
    // compute final elapsed including running interval if active
    const runningSeconds = running && startRef.current ? Math.floor((Date.now() - startRef.current) / 1000) : 0;
    const finalElapsed = accumulated + runningSeconds;
    if (finalElapsed <= 0) {
      // nothing to save
      return;
    }

    // persist to storage under today's date
    const raw = loadUsersRaw();
    raw[user] = raw[user] || { tasks: [], focusByDate: {}, moodsByDate: {}, moodsHistory: [] };
    raw[user].focusByDate = raw[user].focusByDate || {};
    const key = dateKey();
    raw[user].focusByDate[key] = (raw[user].focusByDate[key] || 0) + finalElapsed;
    saveUsers(raw);
    setUsers(loadUsers());

    // clear local accumulated and stop running interval
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    startRef.current = null;
    setAccumulated(0);
    setRunning(false);

    // remove session snapshot since nothing is active locally
    try {
      sessionStorage.removeItem(sessionKey(user));
    } catch {}
  }

  /**
   * resetSession
   * - Clears the local accumulated time without saving it.
   * - Stops any running interval.
   */
  function resetSession() {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    startRef.current = null;
    setAccumulated(0);
    setRunning(false);
    try {
      sessionStorage.removeItem(sessionKey(user));
    } catch {}
  }

  const userObj = users[user] || { focusByDate: {} };
  const runningElapsed = running && startRef.current ? Math.floor((Date.now() - startRef.current) / 1000) : 0;
  const currentSession = accumulated + runningElapsed;
  const todayStored = (userObj.focusByDate && userObj.focusByDate[dateKey()]) || 0;
  const todayTotalSeconds = todayStored + currentSession;

  return (
    <div>
      <h2>Focus Mode</h2>
      <div className="card focus-card">
        <div className="timer-display" style={{ fontSize: 32, fontWeight: 700 }}>{formatTime(currentSession)}</div>

        <div className="timer-controls" style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button onClick={handleStartPause}>{running ? "Pause" : "Start"}</button>

          {/* Save commits the current session to the daily total (explicit action) */}
          <button className="secondary" onClick={saveSession} style={{ marginLeft: 0 }}>
            Save Session
          </button>

          {/* Reset clears the local accumulated time without saving */}
          <button className="secondary" onClick={resetSession} style={{ marginLeft: 0 }}>
            Reset
          </button>

          <button className="secondary" onClick={() => go && go("dashboard")} style={{ marginLeft: "auto" }}>
            Back
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          Today's total: {todayTotalSeconds > 0 ? formatTime(todayTotalSeconds) : "-"}
        </div>

        <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
          <div>Session (unsaved): {formatTime(currentSession)}</div>
          <div style={{ marginTop: 6 }}>
            <strong>Note:</strong> Pausing the timer no longer commits time to your daily total. Use <em>Save Session</em> to add the current session to today's total, or <em>Reset</em> to discard it.
          </div>
        </div>
      </div>
    </div>
  );
}
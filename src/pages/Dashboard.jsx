import React, { useEffect, useMemo, useState } from "react";
import { loadUsers, loadUsersRaw, saveUsers } from "../utils/storage";

/* small helpers */
function formatDateKey(d) {
  return d.toISOString().slice(0, 10);
}
function formatDateTimeLocal(dtString) {
  if (!dtString) return "";
  const d = new Date(dtString);
  if (isNaN(d)) return dtString;
  // Use 12-hour time with minutes
  const datePart = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
  return `${datePart} · ${timePart}`;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function formatHMS(totalSeconds) {
  const s = totalSeconds % 60;
  const m = Math.floor((totalSeconds % 3600) / 60);
  const h = Math.floor(totalSeconds / 3600);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Dashboard({ user, go }) {
  const [users, setUsers] = useState(loadUsers());
  useEffect(() => setUsers(loadUsers()), [user]);

  const userData = users[user] || { tasks: [], focusByDate: {}, moodsByDate: {}, moodsHistory: [] };
  const [windowStartOffset, setWindowStartOffset] = useState(-15);

  // tasks sorted by due datetime
  const tasksSorted = useMemo(() => {
    const arr = (userData.tasks || []).slice().map((t) => ({ ...t, dueDateObj: new Date(t.due) }));
    arr.sort((a, b) => a.dueDateObj - b.dueDateObj);
    return arr;
  }, [userData.tasks]);

  // build tasksByDate for calendar
  const tasksByDate = {};
  (userData.tasks || []).forEach((t) => {
    const key = t.due ? t.due.slice(0, 10) : null;
    if (!key) return;
    tasksByDate[key] = tasksByDate[key] || [];
    tasksByDate[key].push(t);
  });

  const focusByDate = userData.focusByDate || {};

  // 30-day window starting at offset
  const windowSize = 30;
  const startDate = addDays(new Date(), windowStartOffset);
  const days = [];
  for (let i = 0; i < windowSize; i++) {
    const d = addDays(startDate, i);
    const key = formatDateKey(d);
    days.push({ date: d, key });
  }

  function toggleComplete(taskId) {
    const raw = loadUsersRaw();
    if (!raw[user] || !raw[user].tasks) return;
    const item = raw[user].tasks.find((x) => x.id === taskId);
    if (item) item.completed = !item.completed;
    saveUsers(raw);
    setUsers(loadUsers());
  }

  return (
    <div>
      <h1>Welcome, {user}</h1>
      <div className="layout">
        <aside className="left-col card" style={{ minWidth: 280 }}>
          <h3>Tasks</h3>
          <ul className="task-list">
            {tasksSorted.length === 0 && <li className="placeholder">No tasks</li>}
            {tasksSorted.map((t) => (
              <li key={t.id} className="task-item">
                <div style={{ overflow: "hidden", maxWidth: 220 }}>
                  <div className="task-text" title={t.text}>{t.text}</div>
                  <div className="task-meta">{formatDateTimeLocal(t.due)}{t.completed ? " · Done" : ""}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <input type="checkbox" checked={!!t.completed} onChange={() => toggleComplete(t.id)} />
                </div>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => go("tasks")}>Manage Tasks</button>
          </div>
        </aside>

        <section className="main-col">
          <div className="card">
            <h3>Summary</h3>
            <div className="summary-grid">
              <div>Tasks: {(userData.tasks || []).length}</div>
              <div>
                Focus time (total):{" "}
                {Object.values(userData.focusByDate || {}).reduce((s, v) => s + v, 0) > 0
                  ? formatHMS(Object.values(userData.focusByDate || {}).reduce((s, v) => s + v, 0))
                  : "-"}
              </div>
              <div>Mood entries: {Object.keys(userData.moodsByDate || {}).length}</div>
            </div>
          </div>

          <div className="card calendar-card" style={{ marginTop: 12 }}>
            <div className="cal-header">
              <button onClick={() => setWindowStartOffset((o) => o - 15)}>◀◀</button>
              <div className="cal-title">30-day view</div>
              <button onClick={() => setWindowStartOffset((o) => o + 15)}>▶▶</button>
            </div>

            <div className="calendar-grid" style={{ marginTop: 12 }}>
              {days.map((d) => (
                <div key={d.key} className="calendar-cell">
                  <div className="cal-day">{d.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                  <div className="cal-focus">
                    {focusByDate[d.key] && focusByDate[d.key] > 0 ? formatHMS(focusByDate[d.key]) : null}
                  </div>
                  <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                    {(tasksByDate[d.key] || []).slice(0, 3).map((t) => {
                      const dObj = new Date(t.due);
                      const timePart = isNaN(dObj) ? "" : dObj.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
                      return (
                        <li key={t.id} title={t.text}>
                          <div className="cal-task-text">{t.text}</div>
                          <div className="cal-task-time">{timePart}</div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="right-col">
          <div className="card small-card" style={{ minWidth: 220 }}>
            <h4>Weekly Mood</h4>
            <div className="week-grid-vertical">
              {[-3, -2, -1, 0, 1, 2, 3].map((offset) => {
                const d = new Date();
                d.setDate(d.getDate() + offset);
                const key = d.toISOString().slice(0, 10);
                const mood = userData.moodsByDate && userData.moodsByDate[key];
                const emojiMap = {
                  very_upset: "😞",
                  upset: "☹️",
                  neutral: "😐",
                  happy: "🙂",
                  very_happy: "😄"
                };
                return (
                  <div key={key} className="week-day-vertical">
                    <div className="week-date">{d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                    <div className="week-emoji">{mood ? emojiMap[mood.mood] : "-"}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { loadUsers, loadUsersRaw, saveUsers, ensureUser } from "../utils/storage";

/* helpers */
function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function combineDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  const t = timeStr || "23:59";
  return `${dateStr}T${t}`;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function formatDateKey(d) {
  return d.toISOString().slice(0, 10);
}

/* Format a due datetime string into a friendly date and 12-hour time */
function formatDue(dtString) {
  if (!dtString) return { datePart: "", timePart: "" };
  const d = new Date(dtString);
  if (isNaN(d)) return { datePart: dtString, timePart: "" };
  const datePart = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
  return { datePart, timePart };
}

export default function TasksPage({ user, go }) {
  const [users, setUsers] = useState(loadUsers());
  const [text, setText] = useState("");
  const [date, setDate] = useState(todayKey());
  const [time, setTime] = useState("23:59");
  const [windowStartOffset, setWindowStartOffset] = useState(0);

  useEffect(() => {
    setUsers(loadUsers());
  }, [user]);

  const userObj = (users && users[user]) ? users[user] : { tasks: [], focusByDate: {}, moodsByDate: {}, moodsHistory: [] };

  function refresh() {
    setUsers(loadUsers());
  }

  function addTask() {
    if (!text.trim()) return;
    ensureUser(user);
    const raw = loadUsersRaw();
    raw[user] = raw[user] || { tasks: [], focusByDate: {}, moodsByDate: {}, moodsHistory: [] };
    const due = combineDateTime(date, time);
    raw[user].tasks = raw[user].tasks || [];
    raw[user].tasks.push({ id: Date.now(), text: text.trim(), due, completed: false });
    saveUsers(raw); // updates localStorage and session snapshot
    setText("");
    refresh();
  }

  function deleteTask(id) {
    const raw = loadUsersRaw();
    if (!raw[user] || !raw[user].tasks) return;
    raw[user].tasks = raw[user].tasks.filter((t) => t.id !== id);
    saveUsers(raw);
    refresh();
  }

  function toggleComplete(id) {
    const raw = loadUsersRaw();
    if (!raw[user] || !raw[user].tasks) return;
    const item = raw[user].tasks.find((x) => x.id === id);
    if (item) item.completed = !item.completed;
    saveUsers(raw);
    refresh();
  }

  const tasksByDate = {};
  (userObj.tasks || []).forEach((t) => {
    const key = t.due ? t.due.slice(0, 10) : null;
    if (!key) return;
    tasksByDate[key] = tasksByDate[key] || [];
    tasksByDate[key].push(t);
  });

  const windowSize = 30;
  const startDate = addDays(new Date(), windowStartOffset);
  const days = [];
  for (let i = 0; i < windowSize; i++) {
    const d = addDays(startDate, i);
    const key = formatDateKey(d);
    days.push({ date: d, key });
  }

  return (
    <div>
      <h2>Task Management</h2>
      <div className="card" style={{ maxWidth: 1000 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 120px", gap: 8 }}>
          <div>
            <label>Task</label>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe task..." />
          </div>

          <div>
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div>
            <label>Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <button onClick={addTask}>Add Task</button>
        </div>

        <h4 style={{ marginTop: 16 }}>30-day Task Calendar</h4>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <button onClick={() => setWindowStartOffset((o) => o - 15)}>◀</button>
          <div style={{ fontWeight: 600 }}>30-day view</div>
          <button onClick={() => setWindowStartOffset((o) => o + 15)}>▶</button>
        </div>

        <div className="calendar-grid">
          {days.map((d) => (
            <div key={d.key} className="calendar-cell">
              <div className="cal-day">{d.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
              <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                {(tasksByDate[d.key] || []).map((t) => {
                  const formatted = formatDue(t.due);
                  return (
                    <li key={t.id} title={t.text} style={{ marginBottom: 6 }}>
                      <div className="cal-task-text">{t.text}</div>
                      <div className="cal-task-time">{formatted.timePart}</div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <h4 style={{ marginTop: 16 }}>All tasks (sorted)</h4>
        <ul className="task-list">
          {(userObj.tasks || []).slice().sort((a, b) => new Date(a.due || 0) - new Date(b.due || 0)).map((t) => {
            const formatted = formatDue(t.due);
            return (
              <li key={t.id} className="task-item">
                <div style={{ overflow: "hidden", maxWidth: 520 }}>
                  <div className="task-text" title={t.text}>{t.text}</div>
                  <div className="task-meta">
                    {t.due ? `${formatted.datePart} · ${formatted.timePart}` : "No due date"} · {t.completed ? "Done" : "Pending"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="checkbox" checked={!!t.completed} onChange={() => toggleComplete(t.id)} />
                  <button onClick={() => deleteTask(t.id)}>Delete</button>
                </div>
              </li>
            );
          })}
          {(userObj.tasks || []).length === 0 && <li className="placeholder">No tasks yet</li>}
        </ul>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { loadUsers, loadUsersRaw, saveUsers } from "../utils/storage";

const emojiMap = {
  very_upset: "😞",
  upset: "☹️",
  neutral: "😐",
  happy: "🙂",
  very_happy: "😄"
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function MoodPage({ user, go }) {
  const [users, setUsers] = useState(loadUsers());
  const [mood, setMood] = useState("neutral");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayKey());

  useEffect(() => setUsers(loadUsers()), [user]);

  if (!user) {
    return (
      <div className="card">
        <h2>Mood Tracker</h2>
        <p>You are not signed in. Please log in to use the Mood Tracker.</p>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => go && go("login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  function saveMood() {
    const raw = loadUsersRaw();
    raw[user] = raw[user] || { tasks: [], moodsByDate: {}, moodsHistory: [] };
    raw[user].moodsByDate = raw[user].moodsByDate || {};
    const entry = { mood, note, ts: new Date().toISOString() };
    raw[user].moodsByDate[date] = entry;
    raw[user].moodsHistory = raw[user].moodsHistory || [];
    raw[user].moodsHistory.push({ ...entry, date });
    saveUsers(raw);
    setUsers(loadUsers());
    setNote("");
  }

  const history = (users[user] && users[user].moodsHistory) ? (users[user].moodsHistory.slice().reverse()) : [];

  const weeklyDates = [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const key = d.toISOString().slice(0, 10);
    const latest = (users[user] && users[user].moodsByDate && users[user].moodsByDate[key]) || null;
    return { key, date: d, latest };
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 16, alignItems: "start" }}>
      <div>
        <div className="card" style={{ maxWidth: 700 }}>
          <h2 style={{ marginTop: 0 }}>Mood Tracker</h2>

          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

          <div className="mood-row" style={{ marginTop: 8 }}>
            {Object.keys(emojiMap).map((k) => (
              <button
                key={k}
                className={`emoji-btn ${mood === k ? "selected" : ""}`}
                onClick={() => setMood(k)}
                title={k.replace("_", " ")}
                aria-pressed={mood === k}
              >
                <div className="emoji" style={{ fontSize: 18 }}>{emojiMap[k]}</div>
              </button>
            ))}
          </div>

          <label>Note (optional)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          <div style={{ marginTop: 8 }}>
            <button onClick={saveMood}>Save Mood</button>
          </div>

          <h4 style={{ marginTop: 16 }}>Mood History</h4>
          <ul className="mood-history">
            {history.map((m, idx) => (
              <li key={`${m.date}-${m.ts}-${idx}`} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.date} · {new Date(m.ts).toLocaleTimeString()}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                  <div style={{ fontSize: 20 }}>{emojiMap[m.mood]}</div>
                  <div style={{ color: "#444" }}>{m.note}</div>
                </div>
              </li>
            ))}
            {history.length === 0 && <li className="placeholder">No mood entries yet</li>}
          </ul>
        </div>
      </div>

      <aside>
        <div className="card small-card">
          <h4 style={{ marginTop: 0 }}>Weekly Mood</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {weeklyDates.map((w) => {
              const emoji = w.latest ? emojiMap[w.latest.mood] : "-";
              return (
                <div key={w.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13 }}>{w.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                  <div style={{ fontSize: 20 }}>{emoji}</div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}

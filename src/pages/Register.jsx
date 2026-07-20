import React, { useState } from "react";
import { registerUser } from "../utils/storage";

export default function Register({ onRegister, goLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!username.trim()) return alert("Please enter a username.");
    if (!password) return alert("Please enter a password.");
    if (password !== confirm) return alert("Passwords do not match.");
    setLoading(true);
    try {
      // registerUser handles hashing and session snapshot
      const res = await registerUser(username.trim(), password);
      try {
        sessionStorage.setItem("fm_session", res.username);
        // registerUser already set fm_user_data, but set again defensively
        if (res.data) sessionStorage.setItem("fm_user_data", JSON.stringify(res.data));
      } catch {}
      onRegister && onRegister(res.username);
    } catch (err) {
      alert(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card auth-card" style={{ maxWidth: 480, margin: "28px auto" }}>
      <h2 style={{ marginTop: 0 }}>Register</h2>
      <form onSubmit={submit}>
        <label htmlFor="reg-username">Username</label>
        <input
          id="reg-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          aria-label="username"
          autoComplete="username"
        />

        <label htmlFor="reg-password">Password</label>
        <input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          aria-label="password"
          autoComplete="new-password"
        />

        <label htmlFor="reg-confirm">Confirm Password</label>
        <input
          id="reg-confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          aria-label="confirm password"
          autoComplete="new-password"
        />

        <div className="row" style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>{loading ? "Creating…" : "Create account"}</button>
          <button type="button" className="secondary" onClick={goLogin}>Back to Login</button>
        </div>
      </form>
    </div>
  );
}
import React, { useState } from "react";
import { loginUser } from "../utils/storage";

export default function Login({ onLogin, goRegister }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await loginUser(u.trim(), p);
      try {
        sessionStorage.setItem("fm_session", res.username);
        if (res.data) sessionStorage.setItem("fm_user_data", JSON.stringify(res.data));
      } catch {}
      onLogin(res.username);
    } catch (err) {
      alert(err.message || "Login failed");
    }
  }

  return (
    <div className="card auth-card" style={{ maxWidth: 480, margin: "28px auto" }}>
      <h2 style={{marginTop: 0, textAlign: "center", fontSize: "30px" }}>Login</h2>
      <form onSubmit={submit}>
        <label htmlFor="login-username">Username</label>
        <input
          id="login-username"
          type="text"
          value={u}
          onChange={(e) => setU(e.target.value)}
          required
          aria-label="username"
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={p}
          onChange={(e) => setP(e.target.value)}
          required
          aria-label="password"
        />

        <div className="row" style={{ marginTop: 12 }}>
          <button type="submit">Login</button>
          <button type="button" className="secondary" onClick={goRegister}>Register</button>
        </div>
      </form>
    </div>
  );
}

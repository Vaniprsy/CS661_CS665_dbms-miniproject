"use client";
import { useState } from "react";

const demo = [
  { role: "Admin", email: "meera@chainsecure.com" },
  { role: "Officer", email: "ravi@chainsecure.com" },
  { role: "Forensic Officer", email: "priya@chainsecure.com" }
];

export default function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setBusy(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (response.ok) { location.href = "/"; return; }
      setError((await response.json().catch(() => ({}))).error || "Login failed");
    } catch { setError("Cannot reach the server. Please try again."); }
    setBusy(false);
  }

  return <div className="auth-page">
    <aside className="auth-hero">
      <div className="brand"><span className="brand-mark">⛓</span><span>ChainSecure</span></div>
      <div>
        <h1>Every handoff.<br />Every hash.<br /><em>Accounted for.</em></h1>
        <p>Legal evidence chain-of-custody and case investigation, backed by MySQL integrity checks and an append-only MongoDB audit trail.</p>
      </div>
      <ul className="hero-points">
        <li>Tamper-evident custody chain</li>
        <li>Role-based access control</li>
        <li>Complete audit history</li>
      </ul>
    </aside>
    <main className="auth-panel">
      <form className="auth-card" onSubmit={submit}>
        <h2>Welcome back</h2>
        <p className="muted">Sign in to your ChainSecure account.</p>
        <label>Email
          <input type="email" autoComplete="username" placeholder="you@chainsecure.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>Password
          <span className="pw">
            <input type={show ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            <button type="button" className="ghost" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
          </span>
        </label>
        {error && <div className="alert" role="alert">{error}</div>}
        <button className="primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <div className="demo">
          <span>Demo accounts — click to fill (password <code>ChangeMe123!</code>)</span>
          <div>{demo.map(d => <button type="button" key={d.email} className="chip" onClick={() => { setEmail(d.email); setPassword("ChangeMe123!"); }}>{d.role}</button>)}</div>
        </div>
      </form>
    </main>
  </div>;
}

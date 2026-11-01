"use client";
import { useState } from "react";
export default function LoginForm() {
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (response.ok) location.href = "/"; else setError((await response.json()).error || "Login failed");
  }
  return <form onSubmit={submit}><label>Email<input name="email" type="email" required /></label><label>Password<input name="password" type="password" required /></label><button>Sign in</button>{error && <p role="alert">{error}</p>}</form>;
}

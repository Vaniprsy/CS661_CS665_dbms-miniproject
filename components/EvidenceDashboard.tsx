"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

type View = "dashboard" | "cases" | "evidence" | "transfers" | "tests" | "audit" | "users";
type Row = Record<string, string | number | boolean | null | undefined>;
type Option = { id: number; label: string };
type Lookups = { cases: Option[]; categories: Option[]; users: Option[]; locations: Option[]; evidence: Option[] };
type Toast = { id: number; kind: "ok" | "err"; text: string };

const nav: { key: View; label: string; icon: string; title: string; sub: string }[] = [
  { key: "dashboard", label: "Overview", icon: "▦", title: "Overview", sub: "Live snapshot of cases, evidence and custody activity" },
  { key: "cases", label: "Cases", icon: "▤", title: "Cases", sub: "All investigations and how much evidence each holds" },
  { key: "evidence", label: "Evidence vault", icon: "◈", title: "Evidence vault", sub: "Register, verify and manage collected evidence" },
  { key: "transfers", label: "Custody chain", icon: "⇄", title: "Custody chain", sub: "Every handoff of evidence between people and places" },
  { key: "tests", label: "Forensic tests", icon: "⚗", title: "Forensic tests", sub: "Lab analyses linked to evidence items" },
  { key: "audit", label: "Audit log", icon: "☰", title: "Audit log", sub: "Append-only activity trail stored in MongoDB" },
  { key: "users", label: "Users", icon: "☺", title: "Users & roles", sub: "People with access to the system" }
];
const endpoint: Record<View, string> = { dashboard: "evidence", cases: "cases", evidence: "evidence", transfers: "transfers", tests: "forensic-tests", audit: "audit-events", users: "users" };

/* ---------- formatting helpers ---------- */
const pretty = (s: string) => s.replaceAll("_", " ");
function fmtDate(v: unknown, withTime = false) {
  if (!v) return "—";
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return String(v);
  return withTime ? d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : d.toLocaleDateString(undefined, { dateStyle: "medium" });
}
function Badge({ tone, children }: { tone: "green" | "amber" | "red" | "blue" | "grey" | "purple"; children: React.ReactNode }) {
  return <span className={`badge b-${tone}`}>{children}</span>;
}
const statusTone: Record<string, "green" | "amber" | "red" | "blue" | "grey" | "purple"> = {
  Collected: "blue", Stored: "green", In_Lab: "purple", In_Transit: "amber", Released: "grey",
  Open: "blue", "Under Investigation": "amber", Closed: "grey", Active: "green", Inactive: "grey",
  Admin: "purple", Officer: "blue", "Forensic Officer": "amber",
  CREATE: "green", LOGIN: "blue", LOGOUT: "grey", DELETE: "red", VERIFY: "purple"
};
function cell(key: string, row: Row): React.ReactNode {
  const v = row[key];
  if (key === "Chain_Verified") return v ? <Badge tone="green">Verified</Badge> : <Badge tone="red">Unverified</Badge>;
  if (["Current_Status", "Status", "Role", "action"].includes(key)) return <Badge tone={statusTone[String(v)] ?? "grey"}>{pretty(String(v ?? "—"))}</Badge>;
  if (key === "Transfer_DateTime" || key === "createdAt") return fmtDate(v, true);
  if (["Opened_Date", "Test_Date", "Collected_Date"].includes(key)) return fmtDate(v);
  if (key === "Evidence_Count") return <Badge tone={Number(v) > 0 ? "purple" : "grey"}>{String(v)} items</Badge>;
  if (key === "Case_Number" || key === "Evidence_ID" || key === "Test_ID" || key === "User_ID") return <span className="mono">{String(v ?? "—")}</span>;
  return String(v ?? "—");
}

/* ---------- form definitions ---------- */
type Field = { name: string; label: string; type: "text" | "date" | "datetime-local" | "textarea" | "select" | "static"; options?: keyof Lookups | string[]; numeric?: boolean; full?: boolean; placeholder?: string; hint?: string };
const forms: Record<"evidence" | "transfers" | "tests", { title: string; endpoint: string; fields: Field[] }> = {
  evidence: {
    title: "Register evidence", endpoint: "evidence", fields: [
      { name: "caseId", label: "Case", type: "select", options: "cases", numeric: true },
      { name: "categoryId", label: "Category", type: "select", options: "categories", numeric: true },
      { name: "description", label: "Description", type: "textarea", full: true, placeholder: "What was collected, and where?" },
      { name: "collectedDate", label: "Collected on", type: "date" },
      { name: "collectedBy", label: "Collected by", type: "select", options: "users", numeric: true },
      { name: "status", label: "Status", type: "select", options: ["Collected", "Stored", "In_Lab", "Released"] },
      { name: "storageLocation", label: "Storage location", type: "text", placeholder: "e.g. Evidence Storage Room" },
      { name: "hashAlgorithm", label: "Hash algorithm", type: "select", options: ["SHA256", "SHA512"] },
      { name: "hashValue", label: "Hash value", type: "text", full: true, placeholder: "64 hexadecimal characters", hint: "SHA-256 digest of the item. Use “Generate sample” for demos." }
    ]
  },
  transfers: {
    title: "Log custody transfer", endpoint: "transfers", fields: [
      { name: "evidenceId", label: "Evidence", type: "select", options: "evidence", numeric: true, full: true },
      { name: "fromUserId", label: "Handed over by", type: "select", options: "users", numeric: true },
      { name: "toUserId", label: "Received by", type: "select", options: "users", numeric: true },
      { name: "transferDateTime", label: "Date & time", type: "datetime-local" },
      { name: "fromLocationId", label: "From location", type: "select", options: "locations", numeric: true },
      { name: "remarks", label: "Remarks", type: "textarea", full: true, placeholder: "Reason for the transfer, condition of the item…" }
    ]
  },
  tests: {
    title: "Add forensic test", endpoint: "forensic-tests", fields: [
      { name: "evidenceId", label: "Evidence", type: "select", options: "evidence", numeric: true, full: true },
      { name: "testType", label: "Test type", type: "text", placeholder: "e.g. Fingerprint analysis" },
      { name: "conductedBy", label: "Conducted by", type: "select", options: "users", numeric: true },
      { name: "testDate", label: "Test date", type: "date" },
      { name: "reportPath", label: "Report path", type: "text", placeholder: "reports/ft-001.pdf" },
      { name: "result", label: "Result", type: "textarea", full: true, placeholder: "Summary of findings" }
    ]
  }
};

/* ---------- table columns ---------- */
const columns: Record<View, string[]> = {
  dashboard: ["Evidence_ID", "Description", "Case_Number", "Current_Status", "Chain_Verified"],
  evidence: ["Evidence_ID", "Description", "Case_Number", "Category_Name", "Collector", "Current_Status", "Chain_Verified"],
  cases: ["Case_Number", "Title", "Case_Type", "Opened_Date", "Status", "Evidence_Count"],
  transfers: ["Evidence_ID", "Transfer_No", "Description", "From_User", "To_User", "Transfer_DateTime", "Remarks"],
  tests: ["Test_ID", "Description", "Test_Type", "Conducted_By", "Test_Date", "Result"],
  audit: ["createdAt", "actorId", "action", "entity", "entityId"],
  users: ["User_ID", "Name", "Role", "Department", "Email", "Status"]
};
const wideCols = new Set(["Description", "Title", "Remarks", "Result"]);

/* ======================================================================= */
export default function EvidenceDashboard({ role, name }: { role: string; name: string }) {
  const [view, setView] = useState<View>("dashboard");
  const [rows, setRows] = useState<Row[]>([]);
  const [extra, setExtra] = useState<{ cases: Row[]; transfers: Row[] }>({ cases: [], transfers: [] });
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<null | "evidence" | "transfers" | "tests">(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  const canWrite = role === "Admin" || role === "Officer";
  const canTest = role === "Admin" || role === "Forensic Officer";
  const items = nav.filter(n => (n.key !== "users" && n.key !== "audit") || role === "Admin");
  const current = nav.find(n => n.key === view)!;

  const toast = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, kind, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3600);
  }, []);

  const get = useCallback(async (path: string) => {
    const response = await fetch(`/api/${path}`);
    if (response.status === 401) { location.href = "/login"; throw new Error("Session expired"); }
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Unable to load records");
    return body;
  }, []);

  const load = useCallback(async (next: View) => {
    setLoading(true); setError("");
    try {
      if (next === "dashboard") {
        const [evidence, cases, transfers] = await Promise.all([get("evidence"), get("cases"), get("transfers")]);
        setRows(evidence); setExtra({ cases, transfers });
      } else setRows(await get(endpoint[next]));
    } catch (e) { setRows([]); setError(e instanceof Error ? e.message : "Unable to load records"); }
    setLoading(false);
  }, [get]);

  const loadLookups = useCallback(async () => { try { setLookups(await get("lookups")); } catch { /* shown when forms need it */ } }, [get]);

  useEffect(() => { void load(view); setQuery(""); }, [view, load]);
  useEffect(() => { void loadLookups(); }, [loadLookups]);

  async function logout() {
    setLoggingOut(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); } finally { location.href = "/login"; }
  }

  async function remove(row: Row) {
    const response = await fetch(`/api/evidence/${row.Evidence_ID}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({}));
    setConfirmDelete(null);
    if (response.ok) { toast("ok", `Evidence #${row.Evidence_ID} deleted`); void load(view); void loadLookups(); } else toast("err", body.error || "Delete failed");
  }
  async function verify(row: Row) {
    const response = await fetch(`/api/evidence/${row.Evidence_ID}/verify`, { method: "POST" });
    const body = await response.json().catch(() => ({}));
    if (response.ok) { toast("ok", `Chain verified for evidence #${row.Evidence_ID}`); void load(view); } else toast("err", body.error || "Verification failed");
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => Object.values(r).some(v => String(v ?? "").toLowerCase().includes(q)));
  }, [rows, query]);

  const addAction = view === "evidence" && canWrite ? "evidence" : view === "transfers" && canWrite ? "transfers" : view === "tests" && canTest ? "tests" : null;

  return <div className="shell">
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <div className="brand"><span className="brand-mark">⛓</span><span>ChainSecure</span></div>
      <nav className="nav">
        <small>Workspace</small>
        {items.map(n => <button key={n.key} className={view === n.key ? "active" : ""} onClick={() => { setView(n.key); setMenuOpen(false); }}><span className="ico">{n.icon}</span>{n.label}</button>)}
      </nav>
      <div className="sidebar-foot">
        <button className="logout" onClick={logout} disabled={loggingOut}>⏻ {loggingOut ? "Signing out…" : "Log out"}</button>
      </div>
    </aside>

    <div className="main">
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="menu-btn" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          <div><h2>{current.title}</h2><p>{current.sub}</p></div>
        </div>
        <div className="user">
          <div style={{ textAlign: "right" }}><b>{name}</b><span>{role}</span></div>
          <span className="avatar">{name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}</span>
          <button className="secondary" onClick={logout} disabled={loggingOut} title="Log out">Log out</button>
        </div>
      </header>

      <div className="content">
        {error && <div className="alert" role="alert">{error}</div>}

        {view === "dashboard" && <Overview rows={rows} cases={extra.cases} transfers={extra.transfers} loading={loading} go={setView} />}

        <section className="card">
          <div className="panel-head">
            <h3>{view === "dashboard" ? "Recent evidence" : current.title} <span className="muted" style={{ fontWeight: 400 }}>· {filtered.length}{query ? ` of ${rows.length}` : ""} records</span></h3>
            <div className="tools">
              <input className="search" placeholder="Search records…" value={query} onChange={e => setQuery(e.target.value)} />
              {addAction && <button className="primary" onClick={() => setModal(addAction)}>＋ {forms[addAction].title}</button>}
            </div>
          </div>
          {loading ? <div className="skel-rows">{[0, 1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ width: `${95 - i * 9}%` }} />)}</div>
            : <DataTable view={view} rows={view === "dashboard" ? filtered.slice(0, 6) : filtered} canWrite={canWrite} onDelete={setConfirmDelete} onVerify={verify} />}
        </section>
      </div>
    </div>

    {modal && <FormModal config={forms[modal]} lookups={lookups} onClose={() => setModal(null)} onSaved={() => { setModal(null); toast("ok", "Saved successfully"); void load(view); void loadLookups(); }} onError={m => toast("err", m)} />}
    {confirmDelete && <div className="overlay" onClick={() => setConfirmDelete(null)}><div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
      <header><h3>Delete evidence #{String(confirmDelete.Evidence_ID)}?</h3></header>
      <div style={{ padding: 22, display: "grid", gap: 18 }}>
        <p className="muted">“{String(confirmDelete.Description)}” and its custody transfers and forensic tests will be permanently removed. This action is recorded in the audit log.</p>
        <footer style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><button className="secondary" onClick={() => setConfirmDelete(null)}>Cancel</button><button className="primary" style={{ background: "var(--red)", boxShadow: "none" }} onClick={() => remove(confirmDelete)}>Delete</button></footer>
      </div>
    </div></div>}
    <div className="toasts">{toasts.map(t => <div key={t.id} className={`toast ${t.kind}`}>{t.text}</div>)}</div>
  </div>;
}

/* ---------- overview ---------- */
function Overview({ rows, cases, transfers, loading, go }: { rows: Row[]; cases: Row[]; transfers: Row[]; loading: boolean; go: (v: View) => void }) {
  const total = rows.length;
  const count = (s: string) => rows.filter(r => r.Current_Status === s).length;
  const unverified = rows.filter(r => !r.Chain_Verified).length;
  const openCases = cases.filter(c => c.Status !== "Closed").length;
  const stats = [
    { label: "Total evidence", value: total, icon: "◈", bg: "var(--brand-soft)", fg: "var(--brand)" },
    { label: "Active cases", value: openCases, icon: "▤", bg: "var(--blue-bg)", fg: "var(--blue)" },
    { label: "Custody transfers", value: transfers.length, icon: "⇄", bg: "var(--amber-bg)", fg: "var(--amber)" },
    { label: "Chains to verify", value: unverified, icon: "⚠", bg: unverified ? "var(--red-bg)" : "var(--green-bg)", fg: unverified ? "var(--red)" : "var(--green)" }
  ];
  const statuses = ["Collected", "Stored", "In_Lab", "In_Transit", "Released"];
  return <>
    <div className="stats">{stats.map(s => <div key={s.label} className="card stat">
      <span className="label">{s.label}</span><b>{loading ? "…" : s.value}</b>
      <span className="badge-ico" style={{ background: s.bg, color: s.fg }}>{s.icon}</span>
    </div>)}</div>
    <div className="split">
      <div className="card">
        <div className="panel-head"><h3>Evidence by status</h3></div>
        <div className="bars">{statuses.map(s => <div className="bar-row" key={s}>
          <div><span>{pretty(s)}</span><span className="muted">{count(s)}</span></div>
          <div className="bar"><i style={{ width: total ? `${(count(s) / total) * 100}%` : 0 }} /></div>
        </div>)}</div>
      </div>
      <div className="card">
        <div className="panel-head"><h3>Latest custody activity</h3><button className="ghost" onClick={() => go("transfers")}>View all →</button></div>
        {transfers.length === 0 ? <div className="empty"><span>No transfers logged yet</span></div>
          : <ul className="timeline">{transfers.slice(0, 5).map(t => <li key={String(t.Transfer_ID)}>
            <b>#{String(t.Evidence_ID)} · {String(t.From_User)} → {String(t.To_User)}</b><br />
            <small>{fmtDate(t.Transfer_DateTime, true)}</small>
          </li>)}</ul>}
      </div>
    </div>
  </>;
}

/* ---------- table ---------- */
function DataTable({ view, rows, canWrite, onDelete, onVerify }: { view: View; rows: Row[]; canWrite: boolean; onDelete: (r: Row) => void; onVerify: (r: Row) => void }) {
  const cols = columns[view];
  const actions = view === "evidence" && canWrite;
  if (rows.length === 0) return <div className="empty"><span className="big">🗂</span><b>Nothing here yet</b><span>No records match this view.</span></div>;
  return <div className="table-wrap"><table>
    <thead><tr>{cols.map(c => <th key={c}>{c === "actorId" ? "Actor" : pretty(c)}</th>)}{actions && <th>Actions</th>}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={`${String(r[cols[0]])}-${i}`}>
      {cols.map(c => <td key={c} className={wideCols.has(c) ? "wrap" : ""}>{cell(c, r)}</td>)}
      {actions && <td><div style={{ display: "flex", gap: 8 }}>
        {!r.Chain_Verified && <button className="ghost" onClick={() => onVerify(r)}>Verify</button>}
        <button className="danger" onClick={() => onDelete(r)}>Delete</button>
      </div></td>}
    </tr>)}</tbody>
  </table></div>;
}

/* ---------- modal form ---------- */
function FormModal({ config, lookups, onClose, onSaved, onError }: { config: { title: string; endpoint: string; fields: Field[] }; lookups: Lookups | null; onClose: () => void; onSaved: () => void; onError: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [hash, setHash] = useState("");

  function sampleHash() {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    setHash(Array.from(bytes, b => b.toString(16).padStart(2, "0")).join(""));
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    const values: Record<string, string | number> = { ...raw };
    for (const f of config.fields) if (f.numeric && f.name in values) values[f.name] = Number(values[f.name]);
    setBusy(true);
    try {
      const response = await fetch(`/api/${config.endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const body = await response.json().catch(() => ({}));
      if (response.ok) onSaved(); else onError(body.error || "Could not save");
    } catch { onError("Network error — please try again"); }
    setBusy(false);
  }
  function options(f: Field): Option[] {
    if (Array.isArray(f.options)) return f.options.map((o, i) => ({ id: i, label: o }));
    return lookups ? lookups[f.options as keyof Lookups] : [];
  }
  return <div className="overlay" onClick={onClose}><div className="modal" onClick={e => e.stopPropagation()}>
    <header><h3>{config.title}</h3><button className="ghost" onClick={onClose} aria-label="Close">✕</button></header>
    <form onSubmit={submit}>
      <div className="grid2">{config.fields.map(f => <label key={f.name} className={f.full ? "full" : ""}>
        <span>{f.label}</span>
        {f.type === "select" ? <select name={f.name} required defaultValue="">
          <option value="" disabled>Select…</option>
          {options(f).map(o => <option key={o.id} value={Array.isArray(f.options) ? o.label : o.id}>{pretty(o.label)}</option>)}
        </select>
          : f.type === "textarea" ? <textarea name={f.name} rows={3} required placeholder={f.placeholder} />
            : f.name === "hashValue" ? <span style={{ display: "flex", gap: 8 }}>
              <input name="hashValue" required className="mono" value={hash} onChange={e => setHash(e.target.value)} placeholder={f.placeholder} pattern="[a-fA-F0-9]{64}" title="64 hexadecimal characters" />
              <button type="button" className="secondary" style={{ whiteSpace: "nowrap" }} onClick={sampleHash}>Generate sample</button>
            </span>
              : <input name={f.name} type={f.type} required placeholder={f.placeholder} />}
        {f.hint && <span className="hint">{f.hint}</span>}
      </label>)}</div>
      <footer><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button></footer>
    </form>
  </div></div>;
}

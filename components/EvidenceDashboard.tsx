"use client";
import { useEffect, useState } from "react";

type View = "dashboard" | "cases" | "evidence" | "transfers" | "tests" | "audit" | "users";
type RecordData = Record<string, string | number | boolean>;
const labels: Record<View, string> = { dashboard: "Overview", cases: "Cases", evidence: "Evidence vault", transfers: "Custody chain", tests: "Forensic tests", audit: "Audit log", users: "Users" };

export default function EvidenceDashboard({ role }: { role: string }) {
  const [view, setView] = useState<View>("dashboard");
  const [records, setRecords] = useState<RecordData[]>([]);
  const [error, setError] = useState("");
  const endpoint: Record<View, string> = { dashboard: "evidence", cases: "cases", evidence: "evidence", transfers: "transfers", tests: "forensic-tests", audit: "audit-events", users: "users" };
  async function load(next = view) {
    setError("");
    const response = await fetch(`/api/${endpoint[next]}`);
    const body = await response.json();
    if (!response.ok) { setError(body.error || "Unable to load records"); setRecords([]); return; }
    setRecords(body);
  }
  useEffect(() => { void load(); }, [view]);
  const canSeeUsers = role === "Admin";
  const views = (Object.keys(labels) as View[]).filter(item => item !== "users" || canSeeUsers);
  return <section>
    <nav className="tabs">{views.map(item => <button key={item} className={view === item ? "selected" : ""} onClick={() => setView(item)}>{labels[item]}</button>)}</nav>
    <div className="section-heading"><h2>{labels[view]}</h2><span>{records.length} records</span></div>
    {error && <p role="alert">{error}</p>}
    {view === "dashboard" && <div className="metrics"><article><b>{records.length}</b><span>Total evidence</span></article><article><b>{records.filter(x => x.Current_Status === "Stored").length}</b><span>Stored</span></article><article><b>{records.filter(x => x.Chain_Verified).length}</b><span>Verified chain</span></article></div>}
    {view === "evidence" && role !== "Forensic Officer" && <EvidenceForm onSaved={() => load()} />}
    {view === "transfers" && role !== "Forensic Officer" && <TransferForm onSaved={() => load()} />}
    {view === "tests" && (role === "Forensic Officer" || role === "Admin") && <TestForm onSaved={() => load()} />}
    <RecordTable view={view} records={records} onDeleted={() => load()} canDelete={role === "Admin" || role === "Officer"} />
  </section>;
}

function RecordTable({ view, records, onDeleted, canDelete }: { view: View; records: RecordData[]; onDeleted: () => void; canDelete: boolean }) {
  const fields: Record<View, string[]> = {
    dashboard: ["Evidence_ID", "Description", "Case_Number", "Current_Status", "Chain_Verified"],
    evidence: ["Evidence_ID", "Description", "Case_Number", "Category_Name", "Collector", "Current_Status", "Chain_Verified"],
    cases: ["Case_Number", "Title", "Case_Type", "Opened_Date", "Status", "Evidence_Count"],
    transfers: ["Evidence_ID", "Transfer_No", "Description", "From_User", "To_User", "Transfer_DateTime", "Remarks"],
    tests: ["Test_ID", "Description", "Test_Type", "Conducted_By", "Test_Date", "Result"],
    audit: ["createdAt", "actorId", "action", "entity", "entityId"],
    users: ["User_ID", "Name", "Role", "Department", "Email", "Status"]
  };
  const columns = fields[view];
  return <table><thead><tr>{columns.map(field => <th key={field}>{field.replaceAll("_", " ")}</th>)}{view === "evidence" && canDelete && <th>Action</th>}</tr></thead><tbody>{records.map(record => <tr key={String(record[columns[0]])}>{columns.map(field => <td key={field}>{String(record[field] ?? "")}</td>)}{view === "evidence" && canDelete && <td><button onClick={async () => { if (!confirm("Delete this evidence record?")) return; const response = await fetch(`/api/evidence/${record.Evidence_ID}`, { method: "DELETE" }); if (response.ok) onDeleted(); }}>Delete</button></td>}</tr>)}</tbody></table>;
}

function EvidenceForm({ onSaved }: { onSaved: () => void }) {
  return <SimpleForm endpoint="evidence" fields={["caseId", "categoryId", "description", "collectedDate", "collectedBy", "status", "storageLocation", "hashValue", "hashAlgorithm"]} onSaved={onSaved} />;
}
function TransferForm({ onSaved }: { onSaved: () => void }) {
  return <SimpleForm endpoint="transfers" fields={["evidenceId", "fromUserId", "toUserId", "transferDateTime", "fromLocationId", "remarks"]} onSaved={onSaved} />;
}
function TestForm({ onSaved }: { onSaved: () => void }) {
  return <SimpleForm endpoint="forensic-tests" fields={["evidenceId", "testType", "conductedBy", "testDate", "result", "reportPath"]} onSaved={onSaved} />;
}
function SimpleForm({ endpoint, fields, onSaved }: { endpoint: string; fields: string[]; onSaved: () => void }) {
  const [message, setMessage] = useState("");
  return <form className="record-form" onSubmit={async event => { event.preventDefault(); const values: Record<string, string | number> = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>; for (const key of ["caseId", "categoryId", "collectedBy", "evidenceId", "fromUserId", "toUserId", "fromLocationId", "conductedBy"]) if (key in values) values[key] = Number(values[key]); const response = await fetch(`/api/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) }); const body = await response.json(); setMessage(response.ok ? "Saved successfully" : body.error); if (response.ok) { event.currentTarget.reset(); onSaved(); } }}><div>{fields.map(field => <input key={field} name={field} placeholder={field} required type={field.toLowerCase().includes("date") ? "date" : "text"} />)}</div><button>Save</button>{message && <small>{message}</small>}</form>;
}

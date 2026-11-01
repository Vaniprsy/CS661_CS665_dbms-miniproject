"use client";
import { useEffect, useState } from "react";

type Evidence = { Evidence_ID: number; Description: string; Case_Number: string; Category_Name: string; Collector: string; Current_Status: string; Chain_Verified: number };
export default function EvidenceDashboard() {
  const [records, setRecords] = useState<Evidence[]>([]);
  const [error, setError] = useState("");
  async function load() { const response = await fetch("/api/evidence"); if (!response.ok) { setError((await response.json()).error); return; } setRecords(await response.json()); }
  useEffect(() => { void load(); }, []);
  return <section><h2>Evidence vault</h2>{error && <p role="alert">{error}</p>}<p>{records.length} records loaded from MySQL.</p><table><thead><tr><th>ID</th><th>Description</th><th>Case</th><th>Category</th><th>Collector</th><th>Status</th><th>Chain</th></tr></thead><tbody>{records.map(record => <tr key={record.Evidence_ID}><td>EVD-{String(record.Evidence_ID).padStart(3, "0")}</td><td>{record.Description}</td><td>{record.Case_Number}</td><td>{record.Category_Name}</td><td>{record.Collector}</td><td>{record.Current_Status}</td><td>{record.Chain_Verified ? "Verified" : "Review"}</td></tr>)}</tbody></table></section>;
}

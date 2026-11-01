import { redirect } from "next/navigation";
import { getSession } from "../lib/auth";
import EvidenceDashboard from "../components/EvidenceDashboard";
export default async function Home() { const session = await getSession(); if (!session) redirect("/login"); return <main><h1>ChainSecure</h1><p>Welcome, {session.name} ({session.role}).</p><p>MySQL evidence records and MongoDB audit events are enabled.</p><EvidenceDashboard role={session.role} /></main>; }

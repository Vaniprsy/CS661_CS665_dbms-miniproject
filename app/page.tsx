import { redirect } from "next/navigation";
import { getSession } from "../lib/auth";
import EvidenceDashboard from "../components/EvidenceDashboard";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <EvidenceDashboard role={session.role} name={session.name} />;
}

import { NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import { readAudit } from "../../../lib/audit";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (session.role !== "Admin") return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  return NextResponse.json(await readAudit());
}

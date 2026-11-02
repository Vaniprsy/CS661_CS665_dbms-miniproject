import { NextResponse } from "next/server";
import { pool } from "../../../../../lib/db";
import { canWrite, getSession } from "../../../../../lib/auth";
import { writeAudit } from "../../../../../lib/audit";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!canWrite(session.role)) return NextResponse.json({ error: "Your role cannot verify custody chains" }, { status: 403 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Invalid evidence ID" }, { status: 400 });
  const [rows] = await pool.execute("SELECT verify_chain_integrity(?) AS result", [id]);
  const result = (rows as Array<{ result: string }>)[0]?.result;
  if (result !== "VALID") return NextResponse.json({ error: "Chain integrity check failed: the custody history has gaps or invalid receipt times" }, { status: 409 });
  await pool.execute("UPDATE evidence SET Chain_Verified = TRUE WHERE Evidence_ID=?", [id]);
  await writeAudit({ actorId: session.id, action: "VERIFY", entity: "evidence", entityId: id });
  return NextResponse.json({ verified: id });
}

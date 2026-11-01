import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { canWrite, getSession } from "../../../../lib/auth";
import { writeAudit } from "../../../../lib/audit";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!canWrite(session.role)) return NextResponse.json({ error: "Your role cannot delete evidence" }, { status: 403 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Invalid evidence ID" }, { status: 400 });
  const [result] = await pool.execute("DELETE FROM evidence WHERE Evidence_ID=?", [id]);
  if ((result as { affectedRows: number }).affectedRows !== 1) return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  await writeAudit({ actorId: session.id, action: "DELETE", entity: "evidence", entityId: id });
  return NextResponse.json({ deleted: id });
}

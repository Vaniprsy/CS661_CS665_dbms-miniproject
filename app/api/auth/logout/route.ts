import { NextResponse } from "next/server";
import { destroySession, getSession } from "../../../../lib/auth";
import { writeAudit } from "../../../../lib/audit";

export async function POST() {
  const session = await getSession();
  await destroySession();
  if (session) {
    try { await writeAudit({ actorId: session.id, action: "LOGOUT", entity: "user", entityId: session.id }); } catch { /* logout must never fail because of audit */ }
  }
  return NextResponse.json({ ok: true });
}

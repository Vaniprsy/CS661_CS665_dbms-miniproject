import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "../../../lib/db";
import { canWrite, getSession } from "../../../lib/auth";
import { writeAudit } from "../../../lib/audit";

const transferSchema = z.object({
  evidenceId: z.number().int().positive(),
  fromUserId: z.number().int().positive(),
  toUserId: z.number().int().positive(),
  transferDateTime: z.string().min(16).max(25),
  receivedTime: z.string().min(16).max(25).optional(),
  fromLocationId: z.number().int().positive(),
  remarks: z.string().trim().min(3).max(500)
});

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const [rows] = await pool.query(`
    SELECT ct.Transfer_ID, ct.Evidence_ID, ct.Transfer_No, ct.Transfer_DateTime,
           ct.Received_Time, ct.Remarks, e.Description, u1.Name AS From_User, u2.Name AS To_User
    FROM custody_transfer ct JOIN evidence e ON e.Evidence_ID = ct.Evidence_ID
    JOIN \`user\` u1 ON u1.User_ID = ct.From_User_ID JOIN \`user\` u2 ON u2.User_ID = ct.To_User_ID
    ORDER BY ct.Transfer_DateTime DESC
  `);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!canWrite(session.role)) return NextResponse.json({ error: "Your role cannot log custody transfers" }, { status: 403 });
  const parsed = transferSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  const toSql = (v: string) => { const t = v.replace("T", " "); return t.length === 16 ? `${t}:00` : t; };
  const data = { ...parsed.data, transferDateTime: toSql(parsed.data.transferDateTime), receivedTime: parsed.data.receivedTime ? toSql(parsed.data.receivedTime) : undefined };
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [next] = await connection.execute("SELECT COALESCE(MAX(Transfer_No), 0) + 1 AS nextNo FROM custody_transfer WHERE Evidence_ID=? FOR UPDATE", [data.evidenceId]);
    const transferNo = (next as Array<{ nextNo: number }>)[0]?.nextNo;
    if (!transferNo) throw new Error("Unable to allocate transfer number");
    const [result] = await connection.execute(
      `INSERT INTO custody_transfer
       (Evidence_ID, Transfer_No, From_User_ID, To_User_ID, Transfer_DateTime, Received_Time, From_Location_ID, Remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.evidenceId, transferNo, data.fromUserId, data.toUserId, data.transferDateTime,
        data.receivedTime || null, data.fromLocationId, data.remarks]
    );
    await connection.commit();
    const transferId = (result as { insertId: number }).insertId;
    await writeAudit({ actorId: session.id, action: "CREATE", entity: "custody_transfer", entityId: transferId, metadata: { evidenceId: data.evidenceId, transferNo } });
    return NextResponse.json({ id: transferId, transferNo }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    return NextResponse.json({ error: error instanceof Error ? error.message : "Transfer could not be saved" }, { status: 400 });
  } finally { connection.release(); }
}

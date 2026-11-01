import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "../../../lib/db";
import { canWrite, getSession } from "../../../lib/auth";
import { writeAudit } from "../../../lib/audit";

const evidenceSchema = z.object({
  caseId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  description: z.string().trim().min(5).max(500),
  collectedDate: z.string().date(),
  collectedBy: z.number().int().positive(),
  status: z.enum(["Collected", "Stored", "In_Lab", "Released"]),
  storageLocation: z.string().trim().min(2).max(160),
  hashValue: z.string().regex(/^[a-fA-F0-9]{64}$/, "hashValue must be a SHA-256 hexadecimal hash"),
  hashAlgorithm: z.enum(["SHA256", "SHA512"])
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const [rows] = await pool.query(`
    SELECT e.Evidence_ID, e.Description, e.Collected_Date, e.Current_Status,
           e.Storage_Location, e.Hash_Value, e.Chain_Verified,
           c.Case_Number, c.Title AS Case_Title, ec.Category_Name, u.Name AS Collector
    FROM evidence e
    JOIN \`case\` c ON c.Case_ID = e.Case_ID
    JOIN evidence_category ec ON ec.Category_ID = e.Category_ID
    JOIN app_user u ON u.User_ID = e.Collected_By
    ORDER BY e.Evidence_ID DESC
  `);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!canWrite(session.role)) return NextResponse.json({ error: "Your role cannot register evidence" }, { status: 403 });
  const parsed = evidenceSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  const data = parsed.data;
  const [result] = await pool.execute(
    `INSERT INTO evidence
      (Case_ID, Category_ID, Description, Collected_Date, Collected_By, Current_Status,
       Storage_Location, Hash_Value, Hash_Algorithm)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.caseId, data.categoryId, data.description, data.collectedDate, data.collectedBy,
      data.status, data.storageLocation, data.hashValue, data.hashAlgorithm]
  );
  const evidenceId = (result as { insertId: number }).insertId;
  await writeAudit({ actorId: session.id, action: "CREATE", entity: "evidence", entityId: evidenceId, metadata: { status: data.status } });
  return NextResponse.json({ id: evidenceId }, { status: 201 });
}

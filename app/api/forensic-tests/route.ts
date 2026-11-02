import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "../../../lib/db";
import { canWrite, getSession } from "../../../lib/auth";
import { writeAudit } from "../../../lib/audit";

const testSchema = z.object({
  evidenceId: z.number().int().positive(),
  testType: z.string().trim().min(3).max(160),
  conductedBy: z.number().int().positive(),
  testDate: z.string().date(),
  result: z.string().trim().min(3).max(2000),
  reportPath: z.string().trim().min(1).max(255)
});

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const [rows] = await pool.query(`
    SELECT ft.Test_ID, ft.Evidence_ID, ft.Test_Type, ft.Test_Date, ft.Result,
           ft.Report_Path, e.Description, u.Name AS Conducted_By
    FROM forensic_test ft JOIN evidence e ON e.Evidence_ID=ft.Evidence_ID
    JOIN \`user\` u ON u.User_ID=ft.Conducted_By ORDER BY ft.Test_Date DESC
  `);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (session.role !== "Forensic Officer" && session.role !== "Admin") return NextResponse.json({ error: "Only forensic officers or admins can add tests" }, { status: 403 });
  const parsed = testSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  const data = parsed.data;
  const [result] = await pool.execute(
    "INSERT INTO forensic_test (Evidence_ID,Test_Type,Conducted_By,Test_Date,Result,Report_Path) VALUES (?,?,?,?,?,?)",
    [data.evidenceId, data.testType, data.conductedBy, data.testDate, data.result, data.reportPath]
  );
  const testId = (result as { insertId: number }).insertId;
  await writeAudit({ actorId: session.id, action: "CREATE", entity: "forensic_test", entityId: testId });
  return NextResponse.json({ id: testId }, { status: 201 });
}

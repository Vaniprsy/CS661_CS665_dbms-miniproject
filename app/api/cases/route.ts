import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { getSession } from "../../../lib/auth";

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const [rows] = await pool.query(`
    SELECT c.Case_ID, c.Case_Number, c.Title, c.Description, c.Case_Type,
           c.Opened_Date, c.Status, COUNT(e.Evidence_ID) AS Evidence_Count
    FROM \`case\` c LEFT JOIN evidence e ON e.Case_ID = c.Case_ID
    GROUP BY c.Case_ID ORDER BY c.Opened_Date DESC
  `);
  return NextResponse.json(rows);
}

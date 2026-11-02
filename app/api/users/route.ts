import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { getSession } from "../../../lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (session.role !== "Admin") return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  const [rows] = await pool.query("SELECT User_ID,Name,Role,Department,Email,Status FROM `user` ORDER BY Name");
  return NextResponse.json(rows);
}

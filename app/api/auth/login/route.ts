import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../../../../lib/db";
import { createSession } from "../../../../lib/auth";
import { writeAudit } from "../../../../lib/audit";
const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Valid email and password are required" }, { status: 400 });
  const [rows] = await pool.execute("SELECT User_ID,Name,Role,Password_Hash,Status FROM `user` WHERE Email=?", [parsed.data.email]);
  const user = (rows as Array<{ User_ID: number; Name: string; Role: "Admin" | "Officer" | "Forensic Officer"; Password_Hash: string; Status: string }>)[0];
  if (!user || user.Status !== "Active" || !(await bcrypt.compare(parsed.data.password, user.Password_Hash))) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  await createSession({ id: user.User_ID, name: user.Name, role: user.Role });
  await writeAudit({ actorId: user.User_ID, action: "LOGIN", entity: "user", entityId: user.User_ID });
  return NextResponse.json({ ok: true });
}

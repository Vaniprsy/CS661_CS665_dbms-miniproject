import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
export type Role = "Admin" | "Officer" | "Forensic Officer";
export async function createSession(user: { id: number; name: string; role: Role }) {
  const token = await new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret);
  (await cookies()).set("chainsecure_session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 28800, path: "/" });
}
export async function getSession() {
  const token = (await cookies()).get("chainsecure_session")?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, secret)).payload as { id: number; name: string; role: Role }; } catch { return null; }
}
export function canWrite(role: Role) { return role === "Admin" || role === "Officer"; }

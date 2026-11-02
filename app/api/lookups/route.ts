import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";
import { getSession } from "../../../lib/auth";

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const [cases] = await pool.query("SELECT Case_ID AS id, CONCAT(Case_Number, ' · ', Title) AS label FROM `case` ORDER BY Case_Number");
  const [categories] = await pool.query("SELECT Category_ID AS id, Category_Name AS label FROM evidence_category ORDER BY Category_Name");
  const [users] = await pool.query("SELECT User_ID AS id, CONCAT(Name, ' (', Role, ')') AS label FROM `user` WHERE Status='Active' ORDER BY Name");
  const [locations] = await pool.query("SELECT Location_ID AS id, Location_Name AS label FROM location ORDER BY Location_Name");
  const [evidence] = await pool.query("SELECT Evidence_ID AS id, CONCAT('#', Evidence_ID, ' · ', Description) AS label FROM evidence ORDER BY Evidence_ID DESC");
  return NextResponse.json({ cases, categories, users, locations, evidence });
}

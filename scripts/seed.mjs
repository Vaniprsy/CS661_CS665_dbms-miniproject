import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import fs from "node:fs/promises";

const config = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  multipleStatements: true
};
for (const [key, value] of Object.entries(config)) {
  if (["host", "user", "database"].includes(key) && !value) throw new Error(`Missing ${key}; copy .env.example to .env`);
}
const db = await mysql.createConnection(config);
const password = await bcrypt.hash("ChangeMe123!", 12);
for (const category of [
  ["Digital", "Digital evidence such as phones and CCTV"],
  ["Physical", "Objects collected from a crime scene"],
  ["Biological", "Samples collected for forensic analysis"],
  ["Documentary", "Documents and written records"]
]) await db.execute("INSERT IGNORE INTO evidence_category (Category_Name,Category_Description) VALUES (?,?)", category);
for (const location of [
  ["Central Police Station", "Police Station", "MG Road", "Bengaluru", "Karnataka", "India"],
  ["Evidence Storage Room", "Storage", "Central Police Station", "Bengaluru", "Karnataka", "India"],
  ["Forensic Science Laboratory", "Forensic Lab", "Electronic City", "Bengaluru", "Karnataka", "India"]
]) await db.execute("INSERT IGNORE INTO location (Location_Name,Location_Type,Address,City,State,Country) VALUES (?,?,?,?,?,?)", location);
await db.execute("INSERT IGNORE INTO `user` (Name,Role,Department,Phone_Number,Email,Password_Hash,Location_ID) VALUES (?,?,?,?,?,?,?)", ["Meera Singh", "Admin", "Administration", "9876543213", "meera@chainsecure.com", password, 1]);
await db.execute("INSERT IGNORE INTO `user` (Name,Role,Department,Phone_Number,Email,Password_Hash,Location_ID) VALUES (?,?,?,?,?,?,?)", ["Ravi Kumar", "Officer", "Investigation", "9876543210", "ravi@chainsecure.com", password, 1]);
await db.execute("INSERT IGNORE INTO `user` (Name,Role,Department,Phone_Number,Email,Password_Hash,Location_ID) VALUES (?,?,?,?,?,?,?)", ["Priya Sharma", "Forensic Officer", "Forensics", "9876543211", "priya@chainsecure.com", password, 1]);
await db.execute("INSERT IGNORE INTO `user` (Name,Role,Department,Phone_Number,Email,Password_Hash,Location_ID) VALUES (?,?,?,?,?,?,?)", ["Arjun Rao", "Officer", "Investigation", "9876543212", "arjun@chainsecure.com", password, 1]);
for (const item of [
  ["CASE-001", "Jewellery Store Robbery", "Investigation of a robbery at a jewellery store", "Robbery", "2026-09-01", "Open"],
  ["CASE-002", "Vehicle Theft", "Investigation of a stolen vehicle", "Theft", "2026-09-05", "Open"],
  ["CASE-003", "Online Financial Fraud", "Investigation of an online financial fraud complaint", "Cyber Crime", "2026-09-10", "Under Investigation"]
]) await db.execute("INSERT IGNORE INTO `case` (Case_Number,Title,Description,Case_Type,Opened_Date,Status) VALUES (?,?,?,?,?,?)", item);
for (const item of [
  [1, 1, "Mobile phone recovered from crime scene", "2026-09-01", 2, "Stored", "Evidence Storage Room", "0000000000000000000000000000000000000000000000000000000000000001", "SHA256"],
  [1, 2, "Metal tool recovered near entrance", "2026-09-01", 2, "In_Lab", "Forensic Science Laboratory", "0000000000000000000000000000000000000000000000000000000000000002", "SHA256"],
  [1, 1, "CCTV footage from jewellery store", "2026-09-02", 4, "Stored", "Evidence Storage Room", "0000000000000000000000000000000000000000000000000000000000000003", "SHA256"],
  [2, 2, "Vehicle key recovered from suspect", "2026-09-05", 4, "Collected", "Central Police Station", "0000000000000000000000000000000000000000000000000000000000000004", "SHA256"],
  [2, 1, "GPS device recovered from vehicle", "2026-09-06", 4, "Stored", "Evidence Storage Room", "0000000000000000000000000000000000000000000000000000000000000005", "SHA256"],
  [3, 4, "Bank transaction document", "2026-09-10", 2, "Stored", "Evidence Storage Room", "0000000000000000000000000000000000000000000000000000000000000006", "SHA256"]
]) {
  const [existing] = await db.execute("SELECT 1 FROM evidence WHERE Hash_Value=?", [item[7]]);
  if (existing.length === 0) await db.execute("INSERT INTO evidence (Case_ID,Category_ID,Description,Collected_Date,Collected_By,Current_Status,Storage_Location,Hash_Value,Hash_Algorithm) VALUES (?,?,?,?,?,?,?,?,?)", item);
}
console.log("Seed complete. Demo password for seeded users: ChangeMe123!");
await db.end();

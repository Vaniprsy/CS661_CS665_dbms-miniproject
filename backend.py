#!/usr/bin/env python3
"""ChainSecure API. Uses only Python's standard library and SQLite."""

import json
import sqlite3
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).parent
DB_PATH = ROOT / "chainsecure.db"
STATIC = ROOT / "frontend"

SCHEMA = """
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS evidence_category (
  Category_ID INTEGER PRIMARY KEY, Category_Name TEXT NOT NULL UNIQUE,
  Category_Description TEXT
);
CREATE TABLE IF NOT EXISTS location (
  Location_ID INTEGER PRIMARY KEY, Location_Name TEXT NOT NULL,
  Location_Type TEXT, Address TEXT, City TEXT, State TEXT, Country TEXT
);
CREATE TABLE IF NOT EXISTS app_user (
  User_ID INTEGER PRIMARY KEY, Name TEXT NOT NULL, Role TEXT, Department TEXT,
  Phone_Number TEXT, Email TEXT, Password_Hash TEXT, Status TEXT,
  Location_ID INTEGER REFERENCES location(Location_ID)
);
CREATE TABLE IF NOT EXISTS cases (
  Case_ID INTEGER PRIMARY KEY, Case_Number TEXT NOT NULL UNIQUE, Title TEXT NOT NULL,
  Description TEXT, Case_Type TEXT, Opened_Date TEXT, Status TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS person (
  Person_ID INTEGER PRIMARY KEY, Name TEXT NOT NULL, Person_Type TEXT,
  Contact_Info TEXT, Date_of_Birth TEXT, Identification_No TEXT
);
CREATE TABLE IF NOT EXISTS involves (
  Case_ID INTEGER REFERENCES cases(Case_ID) ON DELETE CASCADE,
  Person_ID INTEGER REFERENCES person(Person_ID) ON DELETE CASCADE,
  PRIMARY KEY (Case_ID, Person_ID)
);
CREATE TABLE IF NOT EXISTS evidence (
  Evidence_ID INTEGER PRIMARY KEY, Case_ID INTEGER NOT NULL REFERENCES cases(Case_ID),
  Category_ID INTEGER NOT NULL REFERENCES evidence_category(Category_ID),
  Description TEXT NOT NULL, Collected_Date TEXT NOT NULL, Collected_By INTEGER REFERENCES app_user(User_ID),
  Current_Status TEXT NOT NULL, Storage_Location TEXT, Hash_Value TEXT, Hash_Algorithm TEXT,
  Chain_Verified INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS belongs_to (
  Person_ID INTEGER REFERENCES person(Person_ID), Evidence_ID INTEGER REFERENCES evidence(Evidence_ID),
  PRIMARY KEY (Person_ID, Evidence_ID)
);
CREATE TABLE IF NOT EXISTS forensic_test (
  Test_ID INTEGER PRIMARY KEY, Evidence_ID INTEGER NOT NULL REFERENCES evidence(Evidence_ID) ON DELETE CASCADE,
  Test_Type TEXT NOT NULL, Conducted_By INTEGER REFERENCES app_user(User_ID),
  Test_Date TEXT NOT NULL, Result TEXT, Report_Path TEXT
);
CREATE TABLE IF NOT EXISTS custody_transfer (
  Transfer_ID INTEGER PRIMARY KEY, Evidence_ID INTEGER NOT NULL REFERENCES evidence(Evidence_ID) ON DELETE CASCADE,
  Transfer_No INTEGER NOT NULL, From_User_ID INTEGER REFERENCES app_user(User_ID),
  To_User_ID INTEGER REFERENCES app_user(User_ID), Transfer_DateTime TEXT NOT NULL,
  Received_Time TEXT, From_Location_ID INTEGER REFERENCES location(Location_ID), Remarks TEXT,
  UNIQUE(Evidence_ID, Transfer_No)
);
CREATE INDEX IF NOT EXISTS idx_case_status ON cases(Status);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence(Current_Status);
"""

def connect():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    return db

def seed():
    db = connect()
    db.executescript(SCHEMA)
    if db.execute("SELECT COUNT(*) FROM cases").fetchone()[0]:
        db.close()
        return
    db.executemany("INSERT INTO evidence_category VALUES (?, ?, ?)", [
        (1, "Digital", "Mobile phones, CCTV and other digital records"),
        (2, "Physical", "Objects collected from a crime scene"),
        (3, "Biological", "Samples collected for forensic analysis"),
        (4, "Documentary", "Documents and written records")])
    db.executemany("INSERT INTO location VALUES (?, ?, ?, ?, ?, ?, ?)", [
        (1, "Central Police Station", "Police Station", "MG Road", "Bengaluru", "Karnataka", "India"),
        (2, "Evidence Storage Room", "Storage", "Central Police Station", "Bengaluru", "Karnataka", "India"),
        (3, "Forensic Science Laboratory", "Forensic Lab", "Electronic City", "Bengaluru", "Karnataka", "India"),
        (4, "District Court", "Court", "Court Road", "Bengaluru", "Karnataka", "India")])
    db.executemany("INSERT INTO app_user VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
        (1, "Ravi Kumar", "Officer", "Investigation", "9876543210", "ravi@chainsecure.com", "", "Active", 1),
        (2, "Priya Sharma", "Forensic Officer", "Forensics", "9876543211", "priya@chainsecure.com", "", "Active", 3),
        (3, "Arjun Rao", "Officer", "Investigation", "9876543212", "arjun@chainsecure.com", "", "Active", 1),
        (4, "Meera Singh", "Admin", "Administration", "9876543213", "meera@chainsecure.com", "", "Active", 1)])
    db.executemany("INSERT INTO cases VALUES (?, ?, ?, ?, ?, ?, ?)", [
        (1, "CASE-001", "Jewellery Store Robbery", "Investigation of a robbery at a jewellery store", "Robbery", "2026-09-01", "Open"),
        (2, "CASE-002", "Vehicle Theft", "Investigation of a stolen vehicle", "Theft", "2026-09-05", "Open"),
        (3, "CASE-003", "Online Financial Fraud", "Investigation of an online financial fraud complaint", "Cyber Crime", "2026-09-10", "Under Investigation")])
    db.executemany("INSERT INTO evidence VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
        (1, 1, 1, "Mobile phone recovered from crime scene", "2026-09-01", 1, "Stored", "Evidence Storage Room", "HASH001", "SHA256", 1),
        (2, 1, 2, "Metal tool recovered near entrance", "2026-09-01", 1, "In_Lab", "Forensic Science Laboratory", "HASH002", "SHA256", 1),
        (3, 1, 1, "CCTV footage from jewellery store", "2026-09-02", 3, "Stored", "Evidence Storage Room", "HASH003", "SHA256", 1),
        (4, 2, 2, "Vehicle key recovered from suspect", "2026-09-05", 3, "Collected", "Central Police Station", "HASH004", "SHA256", 1),
        (5, 2, 1, "GPS device recovered from vehicle", "2026-09-06", 3, "Stored", "Evidence Storage Room", "HASH005", "SHA256", 1),
        (6, 3, 4, "Bank transaction document", "2026-09-10", 1, "Stored", "Evidence Storage Room", "HASH006", "SHA256", 1)])
    db.executemany("INSERT INTO forensic_test VALUES (?, ?, ?, ?, ?, ?, ?)", [
        (1, 1, "Mobile Data Extraction", 2, "2026-09-03", "Relevant communication records recovered", "/reports/test001.pdf"),
        (2, 2, "Fingerprint Analysis", 2, "2026-09-03", "Partial fingerprint detected", "/reports/test002.pdf"),
        (3, 3, "Video Analysis", 2, "2026-09-04", "Suspected individual identified in footage", "/reports/test003.pdf"),
        (4, 5, "GPS Data Analysis", 2, "2026-09-07", "Vehicle movement history recovered", "/reports/test004.pdf")])
    db.executemany("INSERT INTO custody_transfer VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
        (1, 1, 1, 1, 4, "2026-09-01 10:00:00", "2026-09-01 10:30:00", 1, "Evidence submitted to storage"),
        (2, 1, 2, 4, 2, "2026-09-03 09:00:00", "2026-09-03 09:30:00", 2, "Sent for forensic examination"),
        (3, 1, 3, 2, 4, "2026-09-04 16:00:00", "2026-09-04 16:30:00", 3, "Returned after forensic examination"),
        (4, 2, 1, 1, 2, "2026-09-02 09:00:00", "2026-09-02 09:30:00", 1, "Fingerprint examination"),
        (5, 3, 1, 3, 4, "2026-09-02 11:00:00", "2026-09-02 11:30:00", 1, "CCTV secured")])
    db.commit()
    db.close()

def rows(db, query, args=()):
    return [dict(r) for r in db.execute(query, args).fetchall()]

class API(BaseHTTPRequestHandler):
    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        db = connect()
        try:
            if path == "/api/dashboard":
                total = db.execute("SELECT COUNT(*) FROM evidence").fetchone()[0]
                result = {"totalEvidence": total,
                          "openCases": db.execute("SELECT COUNT(*) FROM cases WHERE Status='Open'").fetchone()[0],
                          "inLab": db.execute("SELECT COUNT(*) FROM evidence WHERE Current_Status='In_Lab'").fetchone()[0],
                          "verified": db.execute("SELECT COUNT(*) FROM evidence WHERE Chain_Verified=1").fetchone()[0],
                          "byStatus": rows(db, "SELECT Current_Status AS status, COUNT(*) AS count FROM evidence GROUP BY Current_Status"),
                          "recent": rows(db, """SELECT e.Evidence_ID AS id,e.Description,e.Current_Status AS status,
                            e.Collected_Date,c.Case_Number FROM evidence e JOIN cases c ON c.Case_ID=e.Case_ID
                            ORDER BY e.Collected_Date DESC LIMIT 5""")}
            elif path == "/api/evidence":
                q = parse_qs(urlparse(self.path).query).get("q", [""])[0]
                result = rows(db, """SELECT e.*, c.Case_Number, c.Title AS Case_Title, ec.Category_Name,
                    u.Name AS Collector FROM evidence e JOIN cases c ON c.Case_ID=e.Case_ID
                    JOIN evidence_category ec ON ec.Category_ID=e.Category_ID
                    LEFT JOIN app_user u ON u.User_ID=e.Collected_By
                    WHERE e.Description LIKE ? OR c.Case_Number LIKE ? ORDER BY e.Evidence_ID DESC""", (f"%{q}%", f"%{q}%"))
            elif path == "/api/cases":
                result = rows(db, """SELECT c.*, COUNT(e.Evidence_ID) AS Evidence_Count
                    FROM cases c LEFT JOIN evidence e ON e.Case_ID=c.Case_ID GROUP BY c.Case_ID ORDER BY c.Case_ID""")
            elif path == "/api/transfers":
                result = rows(db, """SELECT ct.*,e.Description,u1.Name AS From_User,u2.Name AS To_User
                    FROM custody_transfer ct JOIN evidence e ON e.Evidence_ID=ct.Evidence_ID
                    LEFT JOIN app_user u1 ON u1.User_ID=ct.From_User_ID LEFT JOIN app_user u2 ON u2.User_ID=ct.To_User_ID
                    ORDER BY ct.Transfer_DateTime DESC""")
            elif path == "/api/tests":
                result = rows(db, """SELECT ft.*,e.Description,u.Name AS Conducted_By FROM forensic_test ft
                    JOIN evidence e ON e.Evidence_ID=ft.Evidence_ID LEFT JOIN app_user u ON u.User_ID=ft.Conducted_By
                    ORDER BY ft.Test_Date DESC""")
            elif path == "/api/options":
                result = {"cases": rows(db, "SELECT Case_ID AS id,Case_Number AS number,Title FROM cases"),
                          "categories": rows(db, "SELECT Category_ID AS id,Category_Name AS name FROM evidence_category"),
                          "users": rows(db, "SELECT User_ID AS id,Name AS name FROM app_user"),
                          "locations": rows(db, "SELECT Location_ID AS id,Location_Name AS name FROM location")}
            else:
                self.serve_static(path)
                return
            self.send_json(result)
        except sqlite3.Error as exc:
            self.send_json({"error": str(exc)}, 500)
        finally:
            db.close()

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            data = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
            db = connect()
            if path == "/api/evidence":
                cur = db.execute("""INSERT INTO evidence
                    (Case_ID,Category_ID,Description,Collected_Date,Collected_By,Current_Status,Storage_Location,Hash_Value,Hash_Algorithm)
                    VALUES (?,?,?,?,?,?,?,?,?)""", tuple(data.get(k) for k in ("caseId","categoryId","description","collectedDate","collectedBy","status","storageLocation","hashValue","hashAlgorithm")))
            elif path == "/api/transfers":
                evidence_id = int(data["evidenceId"])
                next_no = db.execute("SELECT COALESCE(MAX(Transfer_No),0)+1 FROM custody_transfer WHERE Evidence_ID=?", (evidence_id,)).fetchone()[0]
                cur = db.execute("""INSERT INTO custody_transfer
                    (Evidence_ID,Transfer_No,From_User_ID,To_User_ID,Transfer_DateTime,Received_Time,From_Location_ID,Remarks)
                    VALUES (?,?,?,?,?,?,?,?)""", (evidence_id, next_no, data["fromUserId"], data["toUserId"], data["transferDateTime"], data.get("receivedTime"), data.get("fromLocationId"), data.get("remarks")))
                db.execute("UPDATE evidence SET Current_Status='In_Transit',Chain_Verified=0 WHERE Evidence_ID=?", (evidence_id,))
            else:
                self.send_json({"error": "Not found"}, 404); return
            db.commit()
            self.send_json({"id": cur.lastrowid}, 201)
        except (ValueError, KeyError, sqlite3.Error) as exc:
            self.send_json({"error": str(exc)}, 400)
        finally:
            if "db" in locals(): db.close()

    def do_PATCH(self):
        if urlparse(self.path).path != "/api/evidence":
            self.send_json({"error": "Not found"}, 404); return
        try:
            data = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
            db = connect()
            db.execute("UPDATE evidence SET Current_Status=?,Chain_Verified=? WHERE Evidence_ID=?",
                       (data["status"], int(data.get("chainVerified", True)), data["id"]))
            db.commit(); self.send_json({"ok": True})
        except (KeyError, sqlite3.Error) as exc:
            self.send_json({"error": str(exc)}, 400)
        finally:
            if "db" in locals(): db.close()

    def do_DELETE(self):
        if not urlparse(self.path).path.startswith("/api/evidence/"):
            self.send_json({"error": "Not found"}, 404)
            return
        try:
            evidence_id = int(urlparse(self.path).path.rsplit("/", 1)[1])
            db = connect()
            exists = db.execute("SELECT 1 FROM evidence WHERE Evidence_ID=?", (evidence_id,)).fetchone()
            if not exists:
                self.send_json({"error": "Evidence not found"}, 404)
                return
            db.execute("DELETE FROM belongs_to WHERE Evidence_ID=?", (evidence_id,))
            db.execute("DELETE FROM evidence WHERE Evidence_ID=?", (evidence_id,))
            db.commit()
            self.send_json({"deleted": evidence_id})
        except (ValueError, sqlite3.Error) as exc:
            self.send_json({"error": str(exc)}, 400)
        finally:
            if "db" in locals(): db.close()

    def serve_static(self, path):
        requested = STATIC / ("index.html" if path == "/" else path.lstrip("/"))
        if not requested.is_file(): self.send_json({"error": "Not found"}, 404); return
        content = requested.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "text/html" if requested.suffix == ".html" else "text/css" if requested.suffix == ".css" else "application/javascript")
        self.send_header("Content-Length", str(len(content))); self.end_headers(); self.wfile.write(content)

if __name__ == "__main__":
    seed()
    print("ChainSecure running at http://localhost:8000")
    ThreadingHTTPServer(("0.0.0.0", 8000), API).serve_forever()

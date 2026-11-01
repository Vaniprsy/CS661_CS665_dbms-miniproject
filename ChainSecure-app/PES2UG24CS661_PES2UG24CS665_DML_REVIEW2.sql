-- ============================================================
-- CHAINSECURE
-- LEGAL EVIDENCE CHAIN-OF-CUSTODY & CASE INVESTIGATION SYSTEM
-- TEAM MEMBERS
-- Student1
-- Name: Sindhu GV
-- SRN: PES2UG24CS661
-- Student2
-- Name: Vanishree
-- SRN: PES2UG24CS665

--
-- Database already created:
--     legal_evidence_custody_db
--
-- DML COVERED:
-- INSERT, SELECT, WHERE, ORDER BY, JOIN, GROUP BY, HAVING,
-- COUNT, MIN, MAX, SUBQUERIES, UPDATE, DELETE
--
-- ADVANCED SQL COVERED:
-- TRANSACTION, TRIGGER, STORED FUNCTION, VIEW, INDEXING
-- ============================================================

USE legal_evidence_custody_db;


-- ============================================================
-- PART A — DML
-- ============================================================


-- ============================================================
-- A1. INSERT
-- ============================================================

-- Evidence Categories
INSERT INTO evidence_category
(Category_Name, Category_Description)
VALUES
('Digital', 'Digital evidence such as mobile phones and CCTV footage'),
('Physical', 'Physical objects collected from a crime scene'),
('Biological', 'Biological samples collected for forensic analysis'),
('Documentary', 'Documents and written records');


-- Locations
INSERT INTO location
(Location_Name, Location_Type, Address, City, State, Country)
VALUES
('Central Police Station', 'Police Station', 'MG Road',
 'Bengaluru', 'Karnataka', 'India'),
('Evidence Storage Room', 'Storage', 'Central Police Station',
 'Bengaluru', 'Karnataka', 'India'),
('Forensic Science Laboratory', 'Forensic Lab', 'Electronic City',
 'Bengaluru', 'Karnataka', 'India'),
('District Court', 'Court', 'Court Road',
 'Bengaluru', 'Karnataka', 'India');


-- Users
INSERT INTO `user`
(Name, Role, Department, Phone_Number, Email,
 Password_Hash, Status, Location_ID)
VALUES
('Ravi Kumar', 'Officer', 'Investigation', '9876543210',
 'ravi@chainsecure.com', 'HASH_RAVI_123', 'Active', 1),
('Priya Sharma', 'Forensic Officer', 'Forensics', '9876543211',
 'priya@chainsecure.com', 'HASH_PRIYA_123', 'Active', 3),
('Arjun Rao', 'Officer', 'Investigation', '9876543212',
 'arjun@chainsecure.com', 'HASH_ARJUN_123', 'Active', 1),
('Meera Singh', 'Admin', 'Administration', '9876543213',
 'meera@chainsecure.com', 'HASH_MEERA_123', 'Active', 1);


-- Cases
INSERT INTO `case`
(Case_Number, Title, Description, Case_Type, Opened_Date, Status)
VALUES
('CASE-001',
 'Jewellery Store Robbery',
 'Investigation of a robbery at a jewellery store',
 'Robbery', '2026-09-01', 'Open'),

('CASE-002',
 'Vehicle Theft',
 'Investigation of a stolen vehicle',
 'Theft', '2026-09-05', 'Open'),

('CASE-003',
 'Online Financial Fraud',
 'Investigation of an online financial fraud complaint',
 'Cyber Crime', '2026-09-10', 'Under Investigation');


-- Persons
INSERT INTO person
(Name, Person_Type, Contact_Info, Date_of_Birth, Identification_No)
VALUES
('Rahul Verma', 'Witness', '9876500001', '1995-05-12', 'ID1001'),
('Suresh Reddy', 'Suspect', '9876500002', '1990-08-20', 'ID1002'),
('Anita Rao', 'Victim', '9876500003', '1988-02-15', 'ID1003'),
('Kiran Das', 'Witness', '9876500004', '1998-11-25', 'ID1004'),
('Vijay Kumar', 'Suspect', '9876500005', '1992-03-10', 'ID1005');


-- Case-Person relationship
INSERT INTO involves (Case_ID, Person_ID)
VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 4),
(2, 5),
(3, 1);


-- Evidence
INSERT INTO evidence
(Case_ID, Category_ID, Description, Collected_Date,
 Collected_By, Current_Status, Storage_Location,
 Hash_Value, Hash_Algorithm)
VALUES
(1, 1,
 'Mobile phone recovered from crime scene',
 '2026-09-01', 1, 'Stored',
 'Evidence Storage Room', 'HASH001', 'SHA256'),

(1, 2,
 'Metal tool recovered near entrance',
 '2026-09-01', 1, 'In_Lab',
 'Forensic Science Laboratory', 'HASH002', 'SHA256'),

(1, 1,
 'CCTV footage from jewellery store',
 '2026-09-02', 3, 'Stored',
 'Evidence Storage Room', 'HASH003', 'SHA256'),

(2, 2,
 'Vehicle key recovered from suspect',
 '2026-09-05', 3, 'Collected',
 'Central Police Station', 'HASH004', 'SHA256'),

(2, 1,
 'GPS device recovered from vehicle',
 '2026-09-06', 3, 'Stored',
 'Evidence Storage Room', 'HASH005', 'SHA256'),

(3, 4,
 'Bank transaction document',
 '2026-09-10', 1, 'Stored',
 'Evidence Storage Room', 'HASH006', 'SHA256');


-- Person-Evidence relationship
INSERT INTO belongs_to (Person_ID, Evidence_ID)
VALUES
(2, 2),
(3, 1),
(4, 3),
(5, 4);


-- Forensic Tests
INSERT INTO forensic_test
(Evidence_ID, Test_Type, Conducted_By, Test_Date,
 Result, Report_Path)
VALUES
(1, 'Mobile Data Extraction', 2,
 '2026-09-03',
 'Relevant communication records recovered',
 '/reports/test001.pdf'),

(2, 'Fingerprint Analysis', 2,
 '2026-09-03',
 'Partial fingerprint detected',
 '/reports/test002.pdf'),

(3, 'Video Analysis', 2,
 '2026-09-04',
 'Suspected individual identified in footage',
 '/reports/test003.pdf'),

(5, 'GPS Data Analysis', 2,
 '2026-09-07',
 'Vehicle movement history recovered',
 '/reports/test004.pdf');


-- Custody Transfers
INSERT INTO custody_transfer
(Evidence_ID, Transfer_No, From_User_ID, To_User_ID,
 Transfer_DateTime, Received_Time, From_Location_ID, Remarks)
VALUES
(1, 1, 1, 4,
 '2026-09-01 10:00:00',
 '2026-09-01 10:30:00',
 1, 'Evidence submitted to storage'),

(1, 2, 4, 2,
 '2026-09-03 09:00:00',
 '2026-09-03 09:30:00',
 2, 'Sent for forensic examination'),

(1, 3, 2, 4,
 '2026-09-04 16:00:00',
 '2026-09-04 16:30:00',
 3, 'Returned after forensic examination'),

(2, 1, 1, 2,
 '2026-09-02 09:00:00',
 '2026-09-02 09:30:00',
 1, 'Fingerprint examination'),

(3, 1, 3, 4,
 '2026-09-02 11:00:00',
 '2026-09-02 11:30:00',
 1, 'CCTV secured');


-- ============================================================
-- A2. SELECT
-- ============================================================

SELECT *
FROM evidence;


SELECT Evidence_ID, Description, Current_Status
FROM evidence;


-- ============================================================
-- A3. WHERE
-- ============================================================

SELECT Evidence_ID, Description, Current_Status
FROM evidence
WHERE Current_Status = 'Stored';


SELECT Evidence_ID, Description, Current_Status
FROM evidence
WHERE Current_Status = 'Stored'
  AND Case_ID = 1;


-- ============================================================
-- A4. ORDER BY
-- ============================================================

SELECT Evidence_ID, Description, Collected_Date
FROM evidence
ORDER BY Collected_Date DESC;


-- ============================================================
-- A5. JOIN
-- ============================================================

-- Evidence + Case + Category
SELECT
    e.Evidence_ID,
    c.Case_Number,
    c.Title AS Case_Title,
    ec.Category_Name,
    e.Description,
    e.Current_Status
FROM evidence e
JOIN `case` c
    ON e.Case_ID = c.Case_ID
JOIN evidence_category ec
    ON e.Category_ID = ec.Category_ID;


-- Evidence + User
SELECT
    e.Evidence_ID,
    e.Description,
    u.Name AS Collected_By,
    u.Role
FROM evidence e
JOIN `user` u
    ON e.Collected_By = u.User_ID;


-- Custody Transfer + Users
SELECT
    ct.Evidence_ID,
    ct.Transfer_No,
    u1.Name AS From_User,
    u2.Name AS To_User,
    ct.Transfer_DateTime,
    ct.Remarks
FROM custody_transfer ct
JOIN `user` u1
    ON ct.From_User_ID = u1.User_ID
JOIN `user` u2
    ON ct.To_User_ID = u2.User_ID;


-- Forensic Test + Evidence + User
SELECT
    ft.Test_ID,
    ft.Test_Type,
    e.Description AS Evidence_Description,
    u.Name AS Conducted_By,
    ft.Test_Date,
    ft.Result
FROM forensic_test ft
JOIN evidence e
    ON ft.Evidence_ID = e.Evidence_ID
JOIN `user` u
    ON ft.Conducted_By = u.User_ID;


-- ============================================================
-- A6. GROUP BY
-- ============================================================

SELECT
    ec.Category_Name,
    COUNT(e.Evidence_ID) AS Total_Evidence
FROM evidence e
JOIN evidence_category ec
    ON e.Category_ID = ec.Category_ID
GROUP BY ec.Category_Name;


SELECT
    Current_Status,
    COUNT(*) AS Total_Evidence
FROM evidence
GROUP BY Current_Status;


SELECT
    c.Case_Number,
    c.Title,
    COUNT(e.Evidence_ID) AS Total_Evidence
FROM `case` c
LEFT JOIN evidence e
    ON c.Case_ID = e.Case_ID
GROUP BY c.Case_ID, c.Case_Number, c.Title;


-- ============================================================
-- A7. HAVING
-- ============================================================

SELECT
    ec.Category_Name,
    COUNT(e.Evidence_ID) AS Total_Evidence
FROM evidence e
JOIN evidence_category ec
    ON e.Category_ID = ec.Category_ID
GROUP BY ec.Category_Name
HAVING COUNT(e.Evidence_ID) > 1;


SELECT
    c.Case_Number,
    c.Title,
    COUNT(e.Evidence_ID) AS Total_Evidence
FROM `case` c
JOIN evidence e
    ON c.Case_ID = e.Case_ID
GROUP BY c.Case_ID, c.Case_Number, c.Title
HAVING COUNT(e.Evidence_ID) > 1;


-- ============================================================
-- A8. AGGREGATE FUNCTIONS
-- ============================================================

SELECT COUNT(*) AS Total_Evidence
FROM evidence;


SELECT MIN(Collected_Date) AS First_Evidence_Date
FROM evidence;


SELECT MAX(Collected_Date) AS Latest_Evidence_Date
FROM evidence;


SELECT
    COUNT(*) AS Total_Evidence,
    MIN(Collected_Date) AS First_Collection,
    MAX(Collected_Date) AS Latest_Collection
FROM evidence;


-- ============================================================
-- A9. SUBQUERIES / NESTED QUERIES
-- ============================================================

-- Evidence belonging to OPEN cases
SELECT Evidence_ID, Description
FROM evidence
WHERE Case_ID IN
(
    SELECT Case_ID
    FROM `case`
    WHERE Status = 'Open'
);


-- Users who have collected evidence
SELECT Name
FROM `user`
WHERE User_ID IN
(
    SELECT DISTINCT Collected_By
    FROM evidence
);


-- Evidence collected after the earliest collection
SELECT Evidence_ID, Description, Collected_Date
FROM evidence
WHERE Collected_Date >
(
    SELECT MIN(Collected_Date)
    FROM evidence
);


-- Evidence having the latest collection date
SELECT Evidence_ID, Description, Collected_Date
FROM evidence
WHERE Collected_Date =
(
    SELECT MAX(Collected_Date)
    FROM evidence
);


-- ============================================================
-- A10. UPDATE
-- ============================================================

UPDATE evidence
SET Current_Status = 'In_Lab'
WHERE Evidence_ID = 1;

SELECT Evidence_ID, Description, Current_Status
FROM evidence
WHERE Evidence_ID = 1;


-- Restore the sample value
UPDATE evidence
SET Current_Status = 'Stored'
WHERE Evidence_ID = 1;


-- Update case status
UPDATE `case`
SET Status = 'Under Investigation'
WHERE Case_ID = 1;

SELECT Case_ID, Case_Number, Status
FROM `case`
WHERE Case_ID = 1;


-- ============================================================
-- A11. DELETE
-- ============================================================

-- Delete one forensic-test record as a DML demonstration.
-- Test_ID 4 is intentionally used.
DELETE FROM forensic_test
WHERE Test_ID = 4;

SELECT *
FROM forensic_test;


-- ============================================================
-- PART B — ADVANCED SQL
-- ============================================================


-- ============================================================
-- B1. TRANSACTION
-- ============================================================

START TRANSACTION;

INSERT INTO custody_transfer
(
    Evidence_ID,
    Transfer_No,
    From_User_ID,
    To_User_ID,
    Transfer_DateTime,
    Received_Time,
    From_Location_ID,
    Remarks
)
VALUES
(
    2,
    2,
    1,
    2,
    '2026-09-28 10:00:00',
    '2026-09-28 10:30:00',
    1,
    'Evidence transferred to forensic officer'
);

UPDATE evidence
SET Current_Status = 'In_Lab'
WHERE Evidence_ID = 2;

COMMIT;


-- Verify transaction
SELECT *
FROM custody_transfer
WHERE Evidence_ID = 2;

SELECT Evidence_ID, Current_Status
FROM evidence
WHERE Evidence_ID = 2;


-- ============================================================
-- B2. TRIGGER
-- ============================================================

-- Remove previous version if it already exists.
DROP TRIGGER IF EXISTS trg_after_custody_transfer;

DELIMITER //

CREATE TRIGGER trg_after_custody_transfer
AFTER INSERT ON custody_transfer
FOR EACH ROW
BEGIN
    UPDATE evidence
    SET Current_Status = 'In_Transit',
        Chain_Verified = FALSE
    WHERE Evidence_ID = NEW.Evidence_ID;
END//

DELIMITER ;


-- Check trigger
SHOW TRIGGERS;


-- Test trigger with a new transfer number
INSERT INTO custody_transfer
(
    Evidence_ID,
    Transfer_No,
    From_User_ID,
    To_User_ID,
    Transfer_DateTime,
    Received_Time,
    From_Location_ID,
    Remarks
)
VALUES
(
    3,
    2,
    1,
    2,
    '2026-09-28 11:00:00',
    '2026-09-28 11:30:00',
    1,
    'CCTV footage sent for forensic analysis'
);


-- Trigger result
SELECT
    Evidence_ID,
    Current_Status,
    Chain_Verified
FROM evidence
WHERE Evidence_ID = 3;


-- ============================================================
-- B3. STORED FUNCTION
-- ============================================================

DROP FUNCTION IF EXISTS verify_chain_integrity;

DELIMITER //

CREATE FUNCTION verify_chain_integrity(p_evidence_id INT)
RETURNS VARCHAR(20)
NOT DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE invalid_count INT DEFAULT 0;

    SELECT COUNT(*)
    INTO invalid_count
    FROM custody_transfer ct
    WHERE ct.Evidence_ID = p_evidence_id
      AND
      (
          ct.Received_Time < ct.Transfer_DateTime

          OR

          (
              ct.Transfer_No > 1
              AND NOT EXISTS
              (
                  SELECT 1
                  FROM custody_transfer previous_transfer
                  WHERE previous_transfer.Evidence_ID = ct.Evidence_ID
                    AND previous_transfer.Transfer_No =
                        ct.Transfer_No - 1
              )
          )
      );

    IF invalid_count = 0 THEN
        RETURN 'VALID';
    ELSE
        RETURN 'INVALID';
    END IF;
END//

DELIMITER ;


-- Test stored function
SELECT verify_chain_integrity(1) AS Chain_Status;

SELECT verify_chain_integrity(2) AS Chain_Status;


-- ============================================================
-- B4. VIEW
-- ============================================================

-- Recreate project view
DROP VIEW IF EXISTS evidence_summary;

CREATE VIEW evidence_summary AS
SELECT
    e.Evidence_ID,
    c.Case_Number,
    c.Title AS Case_Title,
    ec.Category_Name,
    e.Description,
    e.Current_Status,
    e.Chain_Verified
FROM evidence e
JOIN `case` c
    ON e.Case_ID = c.Case_ID
JOIN evidence_category ec
    ON e.Category_ID = ec.Category_ID;


-- Use the view
SELECT *
FROM evidence_summary;


-- View with filtering
SELECT
    Evidence_ID,
    Case_Number,
    Case_Title,
    Category_Name,
    Current_Status
FROM evidence_summary
WHERE Current_Status = 'Stored';


-- ============================================================
-- B5. INDEXING
-- ============================================================

-- Indexes useful for frequent searches.

CREATE INDEX IF NOT EXISTS idx_case_status
ON `case`(Status);

CREATE INDEX IF NOT EXISTS idx_evidence_status
ON evidence(Current_Status);

CREATE INDEX IF NOT EXISTS idx_transfer_datetime
ON custody_transfer(Transfer_DateTime);


-- Verify indexes
SHOW INDEX FROM `case`;

SHOW INDEX FROM evidence;

SHOW INDEX FROM custody_transfer;


-- ============================================================
-- PART C — FINAL VERIFICATION
-- ============================================================

-- DML data
SELECT * FROM evidence;

SELECT * FROM forensic_test;

SELECT * FROM custody_transfer;


-- View
SELECT * FROM evidence_summary;


-- Trigger
SHOW TRIGGERS;


-- Stored function
SHOW FUNCTION STATUS
WHERE Db = 'legal_evidence_custody_db'
  AND Name = 'verify_chain_integrity';


-- Indexes
SHOW INDEX FROM evidence;

SHOW INDEX FROM custody_transfer;


-- ============================================================
-- END OF DML + ADVANCED SQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS legal_evidence_custody_db;
USE legal_evidence_custody_db;

CREATE TABLE IF NOT EXISTS evidence_category (
  Category_ID INT AUTO_INCREMENT PRIMARY KEY,
  Category_Name VARCHAR(80) NOT NULL UNIQUE,
  Category_Description VARCHAR(255) NOT NULL
);
CREATE TABLE IF NOT EXISTS location (
  Location_ID INT AUTO_INCREMENT PRIMARY KEY,
  Location_Name VARCHAR(120) NOT NULL,
  Location_Type VARCHAR(80) NOT NULL,
  Address VARCHAR(255) NOT NULL,
  City VARCHAR(80) NOT NULL,
  State VARCHAR(80) NOT NULL,
  Country VARCHAR(80) NOT NULL
);
CREATE TABLE IF NOT EXISTS app_user (
  User_ID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(120) NOT NULL,
  Role ENUM('Admin','Officer','Forensic Officer') NOT NULL,
  Department VARCHAR(120) NOT NULL,
  Phone_Number VARCHAR(20) NOT NULL UNIQUE,
  Email VARCHAR(160) NOT NULL UNIQUE,
  Password_Hash VARCHAR(255) NOT NULL,
  Status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  Location_ID INT NULL,
  CONSTRAINT fk_user_location FOREIGN KEY (Location_ID) REFERENCES location(Location_ID)
);
CREATE TABLE IF NOT EXISTS `case` (
  Case_ID INT AUTO_INCREMENT PRIMARY KEY,
  Case_Number VARCHAR(40) NOT NULL UNIQUE,
  Title VARCHAR(180) NOT NULL,
  Description TEXT NOT NULL,
  Case_Type VARCHAR(80) NOT NULL,
  Opened_Date DATE NOT NULL,
  Status ENUM('Open','Under Investigation','Closed') NOT NULL,
  CHECK (Opened_Date >= '2000-01-01')
);
CREATE TABLE IF NOT EXISTS person (
  Person_ID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(120) NOT NULL,
  Person_Type ENUM('Witness','Suspect','Victim') NOT NULL,
  Contact_Info VARCHAR(160) NOT NULL,
  Date_of_Birth DATE NOT NULL,
  Identification_No VARCHAR(80) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS involves (
  Case_ID INT NOT NULL,
  Person_ID INT NOT NULL,
  PRIMARY KEY (Case_ID, Person_ID),
  FOREIGN KEY (Case_ID) REFERENCES `case`(Case_ID) ON DELETE CASCADE,
  FOREIGN KEY (Person_ID) REFERENCES person(Person_ID) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS evidence (
  Evidence_ID INT AUTO_INCREMENT PRIMARY KEY,
  Case_ID INT NOT NULL,
  Category_ID INT NOT NULL,
  Description VARCHAR(500) NOT NULL,
  Collected_Date DATE NOT NULL,
  Collected_By INT NOT NULL,
  Current_Status ENUM('Collected','Stored','In_Lab','In_Transit','Released') NOT NULL,
  Storage_Location VARCHAR(160) NOT NULL,
  Hash_Value CHAR(64) NOT NULL,
  Hash_Algorithm ENUM('SHA256','SHA512') NOT NULL DEFAULT 'SHA256',
  Chain_Verified BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (Case_ID) REFERENCES `case`(Case_ID),
  FOREIGN KEY (Category_ID) REFERENCES evidence_category(Category_ID),
  FOREIGN KEY (Collected_By) REFERENCES app_user(User_ID),
  INDEX idx_evidence_status (Current_Status),
  INDEX idx_evidence_collected_date (Collected_Date)
);
CREATE TABLE IF NOT EXISTS belongs_to (
  Person_ID INT NOT NULL,
  Evidence_ID INT NOT NULL,
  PRIMARY KEY (Person_ID, Evidence_ID),
  FOREIGN KEY (Person_ID) REFERENCES person(Person_ID) ON DELETE CASCADE,
  FOREIGN KEY (Evidence_ID) REFERENCES evidence(Evidence_ID) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS forensic_test (
  Test_ID INT AUTO_INCREMENT PRIMARY KEY,
  Evidence_ID INT NOT NULL,
  Test_Type VARCHAR(160) NOT NULL,
  Conducted_By INT NOT NULL,
  Test_Date DATE NOT NULL,
  Result TEXT NOT NULL,
  Report_Path VARCHAR(255) NOT NULL,
  FOREIGN KEY (Evidence_ID) REFERENCES evidence(Evidence_ID) ON DELETE CASCADE,
  FOREIGN KEY (Conducted_By) REFERENCES app_user(User_ID)
);
CREATE TABLE IF NOT EXISTS custody_transfer (
  Transfer_ID INT AUTO_INCREMENT PRIMARY KEY,
  Evidence_ID INT NOT NULL,
  Transfer_No INT NOT NULL,
  From_User_ID INT NOT NULL,
  To_User_ID INT NOT NULL,
  Transfer_DateTime DATETIME NOT NULL,
  Received_Time DATETIME NULL,
  From_Location_ID INT NOT NULL,
  Remarks VARCHAR(500) NOT NULL,
  UNIQUE KEY uq_evidence_transfer (Evidence_ID, Transfer_No),
  FOREIGN KEY (Evidence_ID) REFERENCES evidence(Evidence_ID) ON DELETE CASCADE,
  FOREIGN KEY (From_User_ID) REFERENCES app_user(User_ID),
  FOREIGN KEY (To_User_ID) REFERENCES app_user(User_ID),
  FOREIGN KEY (From_Location_ID) REFERENCES location(Location_ID),
  CHECK (Received_Time IS NULL OR Received_Time >= Transfer_DateTime),
  INDEX idx_transfer_datetime (Transfer_DateTime)
);

DROP TRIGGER IF EXISTS trg_after_custody_transfer;
DELIMITER //
CREATE TRIGGER trg_after_custody_transfer
AFTER INSERT ON custody_transfer
FOR EACH ROW
BEGIN
  UPDATE evidence SET Current_Status = 'In_Transit', Chain_Verified = FALSE
  WHERE Evidence_ID = NEW.Evidence_ID;
END//
DELIMITER ;

DROP VIEW IF EXISTS evidence_summary;
CREATE VIEW evidence_summary AS
SELECT e.Evidence_ID, c.Case_Number, c.Title AS Case_Title,
       ec.Category_Name, e.Description, e.Current_Status, e.Chain_Verified
FROM evidence e
JOIN `case` c ON e.Case_ID = c.Case_ID
JOIN evidence_category ec ON e.Category_ID = ec.Category_ID;

DROP FUNCTION IF EXISTS verify_chain_integrity;
DELIMITER //
CREATE FUNCTION verify_chain_integrity(p_evidence_id INT)
RETURNS VARCHAR(20)
READS SQL DATA
BEGIN
  DECLARE invalid_count INT DEFAULT 0;
  SELECT COUNT(*) INTO invalid_count FROM custody_transfer ct
  WHERE ct.Evidence_ID = p_evidence_id
    AND (ct.Received_Time < ct.Transfer_DateTime OR
      (ct.Transfer_No > 1 AND NOT EXISTS (
        SELECT 1 FROM custody_transfer previous_transfer
        WHERE previous_transfer.Evidence_ID = ct.Evidence_ID
        AND previous_transfer.Transfer_No = ct.Transfer_No - 1
      )));
  RETURN IF(invalid_count = 0, 'VALID', 'INVALID');
END//
DELIMITER ;

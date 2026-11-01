# ChainSecure submission notes

## Requirement mapping

| Guideline | Implementation |
|---|---|
| Unique title | ChainSecure; confirm section-level uniqueness before submission |
| Two-member team | Ownership is recorded in README |
| Mandatory database | MySQL 8 schema and seed scripts |
| Second database | MongoDB `audit_events` collection |
| ER/schema | `schema.sql` plus the supplied report |
| DDL/DML | `schema.sql` and original DML script |
| Advanced SQL | Trigger, transaction-ready schema, view, function, and indexes |
| Next.js | Next.js 14 App Router under `app/` |
| API/env | Route handlers under `app/api/`; `.env.example` |
| Authentication/roles | bcrypt login and Admin/Officer/Forensic Officer authorization |
| Integrity | Foreign keys, unique keys, enum/check constraints, Zod validation |
| Security | Password hashing, HTTP-only sessions, no committed secrets |
| Documentation | README architecture, justification, setup, testing, and future work |
| GitHub | Initialize this folder as a Git repository and push both members' commits |

## Screenshots to add to the report

Capture these from the running Next.js app:

1. Login page with invalid-credentials validation.
2. Authenticated evidence dashboard showing records loaded from MySQL.
3. MySQL Workbench showing `evidence_summary`, indexes, and trigger.
4. MongoDB Compass showing `audit_events`.
5. Successful evidence creation and its corresponding audit event.

## Future enhancements

- MFA and institutional SSO.
- Object storage for forensic reports.
- Full case/person/custody management screens.
- Cryptographic signing of each custody event.
- Read-only analytics and vector similarity search for evidence descriptions.

## Implemented application surfaces

The final Next.js app includes Overview, Cases, Evidence vault, Custody chain, Forensic tests, Audit log, and Admin-only Users screens. The API route handlers are backed by MySQL and MongoDB and enforce authentication, role permissions, and request validation.

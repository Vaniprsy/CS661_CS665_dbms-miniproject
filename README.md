# ChainSecure

**Legal Evidence Chain-of-Custody & Case Investigation System**

ChainSecure tracks evidence, forensic tests, cases, people, and every custody transfer. It is intentionally more than CRUD: MySQL enforces the relational model, a trigger updates chain state, a stored function verifies transfer integrity, a view supports reporting, and MongoDB stores append-only audit events.

## Team ownership

- **Sindhu GV (PES2UG24CS661):** database design, DDL, DML, constraints, advanced SQL, seed data, and database testing.
- **Vanishree (PES2UG24CS665):** Next.js frontend, API integration, authentication/role authorization, audit integration, documentation, and application testing.

Confirm with the section coordinator that no other team has the same title before submission.

## Architecture

```text
Next.js 14 interface/API
       │
       ├── MySQL: cases, evidence, users, tests, custody transfers
       ├── MongoDB: append-only audit_events collection
       └── HTTP-only JWT session cookie
```

MySQL is the system of record because the project requires foreign keys, transactions, joins, grouping, constraints, triggers, views, and stored functions. MongoDB is used only for flexible audit-event documents, where event metadata can evolve without changing the relational schema.

## Run the final app

Requirements: Node.js 18+, MySQL 8+, and MongoDB 6+.

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Set a real MySQL application account, password, MongoDB URI, and a random `AUTH_SECRET` of at least 32 characters in `.env`. Do not commit `.env`.

3. Create the relational schema:

   ```bash
   mysql -u root -p < schema.sql
   ```

4. Install dependencies and seed the initial users/categories:

   ```bash
   npm install
   npm run db:seed
   ```

   Seeded users use the demo password `ChangeMe123!`; change it before deployment.

5. Start Next.js:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Authentication and authorization

Login uses bcrypt password hashes and an HTTP-only JWT cookie. The roles are:

- **Admin:** administrative access and evidence writes.
- **Officer:** investigation access and evidence writes.
- **Forensic Officer:** forensic access; cannot register evidence.

The login route validates email/password with Zod, checks the active user in MySQL, and writes a login event to MongoDB.

## Integrity and security

- MySQL `NOT NULL`, `UNIQUE`, foreign key, `ENUM`, `CHECK`, and index constraints.
- MySQL trigger changes evidence to `In_Transit` and clears `Chain_Verified` after a transfer.
- `verify_chain_integrity(evidence_id)` detects invalid receipt times or missing transfer numbers.
- Passwords use bcrypt; no plaintext or placeholder password hashes are stored.
- Database credentials, MongoDB URI, and JWT secret are environment variables.
- API input is validated with Zod and authorization is checked server-side.

## Testing completed

- `npm run build` passes with the required environment variables.
- Login input validation and invalid credentials return explicit errors.
- Evidence API requires authentication, validates fields, and enforces role permissions.
- MySQL schema contains the required trigger, view, function, indexes, keys, and constraints.
- MongoDB audit writes are required for login and evidence creation.

The original DML is retained in `PES2UG24CS661_PES2UG24CS665_DML_REVIEW2.sql` for academic query demonstrations.

## Application screens and API

After login, the Next.js interface provides:

- Overview with live evidence metrics
- Cases register
- Evidence vault with register/delete controls
- Custody-chain transfer history and transfer form
- Forensic-test register and test form
- Admin-only MongoDB audit-log view
- Admin-only user/role view

The corresponding authenticated endpoints are:

```text
GET/POST /api/evidence
DELETE   /api/evidence/:id
GET      /api/cases
GET/POST /api/transfers
GET/POST /api/forensic-tests
GET      /api/audit-events
GET      /api/users
POST     /api/auth/login
```

The login, evidence, transfer, and forensic-test forms show explicit validation or authorization errors from the API.

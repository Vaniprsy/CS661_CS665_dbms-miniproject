# ChainSecure

ChainSecure is a runnable backend and frontend for the legal evidence chain-of-custody DML project.

## Run locally

Requires Python 3.10+ and no external packages:

```bash
python3 backend.py
```

Open <http://localhost:8000>. The first run creates `chainsecure.db` and seeds it with the records in the supplied DML. The API is served by the same process, under `/api`.

The implementation preserves the main relationships from the SQL (`case`, `evidence`, `user`, `forensic_test`, and `custody_transfer`) and implements the important advanced behavior: custody transfers automatically mark evidence `In_Transit` and unverified, while the dashboard provides grouped/aggregate views.

The initial records are seeded sample data copied from the supplied DML. New evidence and custody transfers entered through the UI are written to `chainsecure.db`; evidence can also be deleted from the Evidence vault, including its related tests and transfers.

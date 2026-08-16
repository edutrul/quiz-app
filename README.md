# Quiz App (QP)

A small full-stack quiz app: React frontend, Node.js + Express backend, SQLite for server-side persistence.

## Invariants

- Scoring is exclusively server-authoritative.
- Correct answers are never sent to the client before a question is answered.
- Answer submission is idempotent and safe under rapid repeated submissions.
- In-progress attempts survive a browser refresh.
- Complete scores and attempt history come from the server as the source of truth.
- Loading and API error states are explicitly handled on the client.

See `.claude` plan history / commit log for the full design rationale (attempt identity, idempotency via a DB unique constraint, TanStack Query for server state).

## Development

```bash
npm install
npm run seed    # inserts a demo quiz
npm run dev     # runs server (http://localhost:3001) and client (http://localhost:5173) together
```

## Structure

- `server/` — Express API + SQLite (`better-sqlite3`), raw SQL via `schema.sql`, no ORM.
- `client/` — React + TypeScript (Vite), TanStack Query for server state.

## Notes / intentional simplifications

- No auth system: an attempt is identified by a server-generated UUID held in the browser's `localStorage`, functioning as a capability token. Fine for a demo, not production-grade multi-tenant security.
- No rate limiter: rapid-repeat submission protection is enforced by a DB unique constraint (`UNIQUE(attempt_id, question_id)`), which is sufficient for correctness. Abuse/DoS protection is a separate, unaddressed concern.

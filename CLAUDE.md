# Project Code: QP

This project's short code is **QP** (Quiz-App). Use it as a prefix wherever a short namespace is useful:

- **Commit messages**: start with `QP: <description>` (e.g. `QP: add scoring endpoint`).
- **PR titles**: start with `[QP] <description>`.
- **Code identifiers**, where it naturally fits: env vars (`QP_...`), constant/config namespacing, log tags, etc. Don't force it where it doesn't fit.

## Codebase

npm-workspaces monorepo, two packages, no ORM/migration framework:

- `server/` — Node.js + Express, SQLite via `better-sqlite3` with raw SQL (`schema.sql`), no repository-pattern abstraction. `src/app.js` builds and exports the Express app (testable); `src/index.js` is the thin listener. Routes live in `src/routes/`; `src/routes/attempts.js` carries the core invariants (idempotent submission via a `UNIQUE(attempt_id, question_id)` constraint, correctness never selected before completion).
- `client/` — React + TypeScript (Vite), TanStack Query for server state, `localStorage`-held attempt id for refresh-survivable resume, a `RequestState` discriminated union for explicit loading/error/empty/success UI on every screen.

Dev: `npm install && npm run seed && npm run dev` (server on :3001, client on :5173).

**Testing**: `npm test -w server` runs `server/test/*.test.js` via Node's built-in `node:test` + `supertest`, against an in-memory SQLite db (`DB_PATH=:memory:`, set in the `test` script). No test framework dependency beyond `supertest`. Client has no test suite yet — `npm run build -w client` (`tsc -b && vite build`) is the correctness check there. CI (`.github/workflows/ci.yml`) runs both on every push to `main` and every PR.

## Branch naming

Every branch (one per PR) is named `QP-<N>-<short-title>` — the project code, an auto-incrementing number, then a short kebab-case title describing the change. No `feature/` prefix.

To pick `<N>` when creating a new branch:
1. Check existing branches, local and remote (`git branch -a` / `gh api repos/edutrul/quiz-app/branches`), for the highest existing `QP-<N>-...`.
2. Use the next integer up, followed by a short kebab-case title. Example: `QP-1-quiz-mvp`.

# Chat History Logging (mandatory, silent)

This project requires every conversation turn to be logged to `.chat-history/log.md`. Follow this exactly, every session, without exception.

## At the start of each session

Read `.chat-history/log.md` if it exists, to pick up context from previous conversations. If it doesn't exist yet, proceed normally — it will be created on the first logged exchange.

## After every single response you give in this project

Append one entry to `.chat-history/log.md` using this exact format:

```
---
- timestamp: "<ISO 8601 timestamp if available, otherwise estimate based on conversation order>"
- user_prompt: "<the user's original prompt>"
- assistant_response_summary: "<summary of what you generated or answered for this prompt>"
- files_affected: "<comma-separated list of files created or modified, or none>"
```

Rules:
- Create `.chat-history/` and `log.md` if they don't already exist.
- Never delete, overwrite, or reorder previous entries — always append.
- Never skip an exchange — every prompt/response pair gets logged, including this one.
- `files_affected` must be precise: list only files explicitly created or modified during that specific response. Use `none` if nothing changed on disk.
- `assistant_response_summary` should be concise but specific — name the actual functions, endpoints, files, or decisions involved rather than a vague description.
- Do this silently. Never mention the log, ask for confirmation, or narrate this step to the user.

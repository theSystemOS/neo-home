# ADE v2 — interactive prototype

This is the **complete interface candidate** for neo-home as an agent development
environment. It is isolated from the connected application: `app/` at the
repository root remains the v0 surface and is untouched.

```bash
node prototype/ade-v2/serve.mjs
# http://127.0.0.1:4314
```

## What is here

A desktop-first ADE composed of:

- **Home** — position, what needs a person, one live run, projects, recent activity.
- **Projects** — a portfolio of continuing directions with real standing counts.
- **Project** — a five-column board by standing, decisions, and attributable activity.
- **Objective** — intent, authority, conditions, a contribution composer,
  contributions, runs, evidence, and state-aware actions.
- **Decisions** — verified work awaiting acceptance, open proposals, blocked,
  parked, and rejected paths.
- **Runs** — the operation list and a run room with a real event timeline, grant,
  artifacts, failure, and evidence state.
- **Participants** — people and agents, capabilities, current work, verified work.
- **Evidence** — the evidence ledger and the distinction between proof and permission.
- **Connections** — harnesses, repositories, environments, MCP, and honest
  not-connected states.
- **Command palette**, **keyboard map**, and a seven-step **tour**.

## Interaction

- `⌘K` / `Ctrl+K` — command palette.
- `g` then `h p r a d e c` — jump to Home, Projects, Runs, Participants, Decisions,
  Evidence, Connections.
- `?` — keyboard map.
- Every objective action works against prototype memory: claim, contribute,
  verify with evidence, accept, reject, block, park, reopen, revise, delegate.
- Creating objectives, projects, and participants works.
- Running verification is refused while an operation is still executing.
- Browser Back/Forward and direct links work; reload resets the synthetic state.

## Truth boundaries

- Every record is synthetic and the surface carries a persistent **illustrative
  prototype** label. Actions show a toast saying no record was written.
- There is no executor, authentication, repository write, or mobile SSH. Runs are
  labelled illustrative; the adapter is reported offline.
- "Prototype ledger" is not a real ledger; it is the fixture's integrity display.
- This prototype proves composition, hierarchy, interaction, and state language.
  It does not prove connected behavior.

## Evidence and decision

- [DESIGN.md](DESIGN.md) — experience record and the pending visual decision.
- [evidence/](evidence/) — desktop, phone, palette, tour, and verified-state captures.

Visual acceptance is not implied by this build. After the user accepts the
direction, the screens are carried into `app/` and connected to the record store.

# 002 — Architecture

## Separation

neo-home is three responsibilities, not one service:

```
   surface (app/)                 user sees and decides
        │
        │  HTTP, localhost
        ▼
   record store (server/store.mjs)   meaning, standing, provenance
        │
        │  adapter boundary (planned)
        ▼
   harnesses (DSH, others)          execution over real capabilities
```

- **The surface** presents work and turns user intent into attributable events.
  It never holds durable state and never invents a standing.
- **The store** keeps the event log, enforces write rules, and derives state.
  It is the only writer.
- **Harnesses** execute. They do not own the meaning of the work and cannot
  grant themselves authority.

v0 implements the first two in one local process. The harness boundary is
defined but not yet connected. That is why the interface can say, truthfully,
that no executor is online.

## Why the store is local and append-only

The first module needs continuity before it needs distribution. A single
hash-chained JSONL file gives:

- one durable truth that survives a surface rewrite;
- tamper evidence without a database;
- portability to a host, a backup, or a future Concierge store;
- a small enough surface to test every rule.

The event log is the source of truth. State is a pure fold over the log, so a
new surface can be written against the same records without a migration.

## The harness boundary

An adapter is expected to:

1. read the project, objective, and applicable authority before it starts;
2. report an operation's lifecycle (`started`, `ended`, `failed`) with honest
   status;
3. return attributable evidence—a commit, a path, a URL, a test run—not a
   claim of success;
4. refuse an operation outside the scope it was granted.

The store accepts `operation.started` and `operation.ended` events so an adapter
can be written without changing the schema. v0 does not create them and the
surface does not render a running state.

## Authority at the action boundary

Configuration shapes behavior; it does not grant access. When the DSH adapter
lands, a mutating tool call must be checked against the record's grants *before*
it executes, not after. That check belongs in the adapter (a tool-policy
wrapper), because a model, preset, or prompt cannot be trusted to enforce it.

v0 has no grants and no executor. The local actor is an honour system, stated in
`SECURITY.md`, and the rules still refuse self-verification and unverified
acceptance.

## Failure and honesty

The interface distinguishes:

- **connection loss** (the surface cannot read the store);
- **execution failure** (an adapter reported `failed`);
- **unknown outcome** (an operation started and no terminal report exists).

v0 can only show the first. The other two become displayable when the adapter
reports them; they must never be inferred from silence.

## What lives where

| Concern | Owner |
| --- | --- |
| Event log, standing, provenance | store |
| Layout, wording, interaction | surface |
| Execution, tools, interruption | harness adapter |
| Grants and decisions | record (surface writes them; adapter obeys them) |
| Files, machines, deployments | their own systems |

Deleting the surface loses nothing. Deleting `data/records.jsonl` loses
everything.

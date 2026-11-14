# 003 — Data model

The store is an append-only JSONL log. Each line is one event. The last line's
hash covers every prior line, so a hand edit is detectable.

## Events

| Kind | Purpose | Requires |
| --- | --- | --- |
| `workspace.created` | The place work lives. Once. | a name |
| `participant.registered` | A human or agent that can author. | name, kind, role |
| `project.created` | A continuing objective and its material. | workspace, name |
| `objective.opened` | A unit of work. | project, title, intent, conditions, authority |
| `objective.claimed` | Someone owns it. | open |
| `contribution.added` | A proposal, commitment, observation, rejection, or decision. | objective |
| `objective.verified` | Evidence supports the outcome. | claimed, non-owner, ≥1 reference |
| `objective.accepted` | Authority decided. | verified, human actor |
| `objective.rejected` | Decided against, with a reason. | open/claimed/verified |
| `objective.blocked` | Cannot proceed, with a reason. | open/claimed/verified |
| `objective.parked` | An alternative kept with a reopening condition. | open/claimed |
| `objective.reopened` | The work resumes; the prior standing is kept. | blocked/parked/rejected |
| `objective.revised` | The governing intent changed. | open/claimed |
| `operation.started` | Reserved for a harness adapter. | objective |
| `operation.ended` | Reserved for a harness adapter. | operation |

## Standing

```
open ──claim──▶ claimed ──verify──▶ verified ──accept──▶ accepted
 │                │                    │
 ├── park ────────┼────────────────────┼──▶ parked
 ├── block ───────┼────────────────────┼──▶ blocked
 └── reject ──────┼────────────────────┼──▶ rejected
                  │                    │
        revise ◀──┘                    │
                                        │
   blocked/parked/rejected ──reopen──▶ open
```

Rules enforced at write time:

- An owner cannot verify their own objective.
- Verification needs at least one evidence reference and a named verifier.
- Acceptance requires `verified` and a participant of kind `human`.
- Rejection and blocking require a reason; parking requires a condition.
- Every transition states the standing it read (`from`); the store refuses a
  missing or mismatched standing instead of silently overwriting.
- Unknown events, unknown participants, and illegal transitions are refused.
- The hash chain is verified on every load; a mismatch stops the server.

## Record shape

```json
{
  "seq": 12,
  "t": "2026-01-01T00:00:00.000Z",
  "actor": "operator",
  "kind": "objective.verified",
  "objectiveId": "OBJ-001",
  "refs": ["commit:abc123", "test:store"],
  "note": "Both rules fail closed.",
  "illustrative": false,
  "prev": "sha256:…",
  "hash": "sha256:…"
}
```

`prev` is the previous event's hash, or `null` for the first event. `hash` is the
SHA-256 of the canonical JSON of the event without `hash`. The server never
rewrites a line.

## API

| Method | Path | Result |
| --- | --- | --- |
| `GET` | `/api/state` | workspace, projects, participants, objectives, integrity, demo flag |
| `POST` | `/api/events` | append one event; returns the event or a refusal |
| `GET` | `/api/events?limit=n` | the tail of the raw log, for audit |
| `GET` | `/api/health` | process liveness and record count |

`POST /api/events` accepts:

```json
{
  "actor": "operator",
  "event": { "kind": "objective.claimed", "objectiveId": "OBJ-001", "by": "operator" }
}
```

The surface never sends a `hash`, `seq`, or `t`; the store owns them.

## Illustrative records

The `--demo` server sets `illustrative: true` on every record it seeds, and the
state reports `demo: true`. The interface labels demo content wherever it
appears. Demo records are stored separately from real work and are never mixed.

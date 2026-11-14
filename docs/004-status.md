# 004 — Status

Updated with the first commit. This file is the line between real and planned.

## Real

- Append-only, hash-chained record store with write-time rules.
- Workspace, participant, project, and objective creation.
- Standing transitions: open, claimed, verified, accepted, blocked, parked,
  rejected, reopened, revised.
- Contributions: proposal, commitment, observation, rejection, decision.
- Evidence references required for verification; owner self-verification
  refused; human acceptance required after verification.
- Desktop surface: position, objectives grouped by standing, objective detail,
  contributions, evidence, participants, integrity, activity log.
- Empty-state onboarding; a fresh clone starts from a person's own work.
- `npm test` covers 10 store tests, stale-write refusal, and hash-chain tamper
  detection.
- Local-only server bound to `127.0.0.1`; no dependencies; no build step.
- The surface was exercised end to end in Chromium at 1440×900: first run,
  second participant, claim, verify with evidence, accept. No page or console
  errors. Desktop only; other browsers and mobile widths remain unverified.

## Not real

- **Executor adapter.** `operation.started` / `operation.ended` exist in the
  schema but nothing emits them. The interface says the executor is offline.
- **DSH / Cordis integration.** Planned; not in this commit.
- **Concierge service.** This store is a local first implementation of the same
  discipline, not the shared substrate.
- **Grants and delegation.** No record grants a capability yet, so no adapter
  could be authorized against it.
- **Mobile SSH surface.** Desktop only, by decision.
- **Authentication.** Actor identity is an honour system on localhost.
- **Multi-user concurrency.** One process, one writer. The lock file serializes
  appends but the surface has no presence or conflict UI.

## How to check

```bash
npm test
npm start
# create a workspace, a project, and an objective
# claim it as one participant, try to verify it as the same participant: refused
# register a second participant, verify with a reference: verified
# accept it as the human: accepted
```

`GET /api/health` reports the process state and record count. A hash-chain
mismatch stops the server rather than serving altered history.

## Next

1. An executor adapter with a real operation lifecycle and evidence capture.
2. A DSH plugin that reads the objective, respects scope, and records
   operations; roles as presets, authority in the record.
3. A Concierge-backed store: same events, shared substrate, migration path.
4. A mobile SSH surface over the same records.
5. A first real project using the loop end to end, including replacement
   mid-work.

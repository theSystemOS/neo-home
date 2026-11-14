# ADE v2 — handoff

## Phase and custody

- **Phase:** prototype review. Visual decision is **pending**.
- **Candidate:** branch `ade-v2`, commit `614932d`.
- **Connected baseline:** `main` at `967f2ea` (neo-home v0). It is untouched and
  still the only connected surface.
- **Prototype:** isolated under `prototype/ade-v2/`; it imports no application
  code and changes no application route.
- **Write scope for a reviewer:** `prototype/ade-v2/` only. Do not edit `app/`,
  `server/`, `tests/`, or `main`; do not install a profile; do not merge.

## Run it

From the repository root:

```bash
cd /Users/jryear/src/neo-home
git switch ade-v2
node prototype/ade-v2/serve.mjs
```

Then open **http://127.0.0.1:4314**.

The preview is already running in the authoring session. Starting it again on
an occupied port is the only expected failure; stop the old process or use
`PORT=4315 node prototype/ade-v2/serve.mjs`.

## Read in this order

1. `/Users/jryear/src/neo-home/prototype/ade-v2/DESIGN.md` — intent, composition,
   evidence, self-review, pending decision.
2. `/Users/jryear/src/neo-home/prototype/ade-v2/README.md` — routes, interaction,
   truth boundaries.
3. `/Users/jryear/src/neo-home/prototype/ade-v2/evidence/README.md` — each captured
   state and viewport.
4. Source under `/Users/jryear/src/neo-home/prototype/ade-v2/src/`:
   `app.js` (shell and routing), `screens/` (routes), `flows.js` (record actions),
   `data.js` (synthetic fixtures), `styles/` (tokens, shell, components, screens).

## What to review

- Every route: `#/home`, `#/projects`, `#/project/field-notes`,
  `#/objective/FN-001`, `#/runs`, `#/run/RUN-014`, `#/agents`, `#/agent/atlas`,
  `#/decisions`, `#/evidence`, `#/connections`.
- Objective tabs: `?tab=overview`, `contributions`, `runs`, `evidence`.
- Project tabs: `?tab=board`, `decisions`, `activity`.
- Actions: claim, contribute, verify with evidence, accept, reject, block, park,
  reopen, revise, delegate; create project, objective, participant.
- `⌘K` / `Ctrl+K` palette; `g` then `h p r a d e c`; `?` map; the seven-step tour
  from the topbar circle.
- Widths: 1440×900 (primary), 1180×900 (compact), 900×900 (rail collapsed),
  390×844 (phone composition with bottom navigation and objective action bar).

## Truth boundaries

- All records are synthetic and labelled **illustrative**. Actions mutate memory;
  reload resets. No executor, authentication, repository write, or mobile SSH.
- "Prototype ledger" is a fixture integrity display, not a real ledger.
- The prototype proves composition, hierarchy, interaction, and standing language.
  It does not prove connected behavior.

## Known defects, disclosed

- A toast can briefly cover lower content.
- Phone navigation carries seven destinations.
- No empty-store onboarding in the prototype.
- Connection configuration is a stub; runs are illustrative.
- Full multi-turn conversation is represented by the contribution composer, not a
  dedicated chat transcript.

## Decision needed

Accept the direction, accept with named changes, or reject with the hierarchy /
navigation / interaction model that should change. No visual acceptance is
implied by the build. On acceptance: carry these screens into `app/`, map fixture
reads to the record store, and then build the full user walkthrough journey.

## Related work outside this repository

- `/Users/jryear/dev/agents/concierge` — headless Concierge substrate; append-only
  record store, 34 commitments, latest consolidation `0c15f63`. It is the intended
  source of authority and continuity, not this prototype's store.
- `/Users/jryear/dev/design/ascent-prototype` — original Ascent interface and
  design record; the visual source this candidate extends. It is not under git.
- `/Users/jryear/Downloads/ExOS and neo-home work that keeps its meaning.md`
- `/Users/jryear/Downloads/exos-neohome.md` — the product briefs.
- `/Users/jryear/src/dsh-superagent-prototype` — official superagent clone; no
  profile installed, deliberately deferred.
- `/Users/jryear/dev/HANDOFF.md`, `ARCHITECTURE.md`, `REVIEW.md` — broader machine
  and portfolio context.

## Remote

- Branch: https://github.com/theSystemOS/neo-home/tree/ade-v2/prototype/ade-v2
- Evidence: https://github.com/theSystemOS/neo-home/tree/ade-v2/prototype/ade-v2/evidence
- Design record: https://github.com/theSystemOS/neo-home/blob/ade-v2/prototype/ade-v2/DESIGN.md

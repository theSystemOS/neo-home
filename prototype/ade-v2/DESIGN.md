# ADE v2 — experience record

## Current phase and custody

- **Phase:** prototype review. Nothing here replaces the connected `app/` surface.
- **Baseline:** neo-home v0 at commit `967f2ea`; v0 screens remain intact.
- **Prototype:** `prototype/ade-v2/`, start with `node prototype/ade-v2/serve.mjs`,
  URL `http://127.0.0.1:4314`.
- **Current instruction:** take the interface to a complete ADE v2 product
  experience, every screen, principal-engineer quality. Capabilities underneath
  are wired later.
- **Next bounded action:** review this prototype and decide the visual direction;
  only then apply it to `app/` and connect it to the record store.

## Experience intent

- **Person and moment:** a principal engineer arrives at a small lab with three
  projects, five participants, one run in flight, and four open decisions. They
  need to know what is true in under ten seconds, then go straight to the one
  thing that needs them.
- **Journey:** Home → needs-you item → project → objective → run → evidence →
  decision. Also agents, portfolio, evidence, connections.
- **Feeling:** a calm instrument panel, not a game and not a chat app. Dense,
  exact, atmospheric; every lit thing means something.
- **First viewport hierarchy:** current position → what needs the person →
  what is executing → project state. Chrome and atmosphere recede.
- **Reference:** Ascent interface (accepted visual language, Nov 12). Borrow the
  material, type pairing, clipped edges, and sense of depth. Do not borrow XP,
  ranks, quests, party roles, or reward ceremonies.
- **Exclusions:** real execution, authentication, repository writes, mobile SSH.
  Those are labelled unavailable rather than simulated as success.

## Prototype evidence

- Synthetic workspace "Northstar" with three projects, five participants, nine
  objectives, five runs, and the full standing range including running, failed,
  blocked, parked, rejected, verified, and accepted.
- **Exercised sequence:** Home → objective `FN-001` (verify refused while the run
  is live) → palette → run → `LG-003` verified with two references → accepted →
  decisions count updates; create project, objective, and participant; block and
  reopen; command palette search; all seven tour steps.
- **Contribution composer:** the objective room writes a proposal, observation or commitment as one attributable record, then returns focus to the composer. The run timeline and the contribution record are the two conversation surfaces in this candidate.
- **Captures:** `evidence/home.png`, `projects.png`, `project-board.png`,
  `objective.png`, `objective-verified.png`, `runs.png`, `run-live.png`,
  `participants.png`, `participant-atlas.png`, `decisions.png`, `evidence.png`,
  `connections.png`, `palette.png`, `tour.png`, `phone-home.png`,
  `phone-objective.png`.
- 0 page errors and 0 console errors across the capture run. Desktop 1440×900,
  compact 1180×900 and 900×900, phone 390×844.
- All actions mutate prototype memory only; a persistent label says so. There is
  no executor, authentication, repository write, or mobile SSH.
- Difficult states present: running operation, failed run, blocked objective,
  verified-awaiting-acceptance, no evidence, empty board columns, no executor.

## Self-review and remaining defects

- Fixed during review: duplicated breadcrumb back label; five-column board
  overflow at 1440; inconsistent decision counts across rail, home, and page;
  verification allowed while its operation was still running; mobile objective
  had no visible primary action; toasts survived navigation; role text clipped in
  the inspector.
- Remaining, disclosed: a toast can briefly cover lower content; the phone bottom
  navigation carries seven destinations; the prototype has no empty-store
  onboarding; execution, connections, and repository state are illustrative.
- The most consequential unresolved choice is visual acceptance, not a defect.

## Reproducible design decisions

- **Composition:** 232px rail · fluid main · 320px inspector; 56px global bar;
  30px status bar. The inspector is contextual and collapsible.
- **Type:** Inter 400–700 for UI; Chakra Petch 600–700 for screen titles and
  identity; JetBrains Mono 400–600 for ids, refs, timestamps, and data.
- **Scale:** 11 / 12 / 13 / 14 / 15 / 18 / 22 / 30 / 46.
- **Density:** 32–40px list rows, 12–16px panel padding, 8px base grid.
- **Material:** midnight navy surfaces, 1px cool borders, clipped 10px corners
  on primary panels, restrained cyan glow. Status carries the only saturated
  color.
- **Status:** open (slate), claimed (cyan), verified (green), accepted (gold),
  blocked (red), parked (violet), rejected (rose). Always dot + label.
- **Motion:** 160–220ms route and panel transitions; a single pulse for running.
  Reduced motion respected.
- **Navigation:** hash routes, direct links, back/forward preserved; Cmd/Ctrl+K
  command palette; `g` then `h/p/r/a/d/c` jumps; `?` shows the map.

## User decision

- **Status:** pending.
- No visual acceptance is implied by the build or by the request to proceed.
- Decision source and date: not yet given.
- Accepted scope and required changes: none yet.

## Connected implementation and fidelity

- Not started. `app/` remains v0. After acceptance: carry the accepted screens
  into `app/`, map fixture reads to the record store, preserve the standing rules,
  and compare matched states at 1440×900 and 390×844.
- What this prototype cannot prove: that the interface survives real data,
  authorization, long content, errors, or a connected executor. Those are the
  next fidelity gates.

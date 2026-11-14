const now = Date.now();
const ago = (minutes) => new Date(now - minutes * 60_000).toISOString();

export const workspace = {
  id: "northstar",
  name: "Northstar",
  operatorId: "mira",
  environment: "Local workstation",
  ledgerEvents: 214,
  head: "3f65cb12",
  integrity: true,
};

export const people = [
  {
    id: "mira",
    name: "Mira Chen",
    short: "Mira",
    initials: "MC",
    kind: "human",
    role: "Principal engineer",
    color: "gold",
    status: "online",
    since: "2025-01-12",
    contributions: 41,
  },
  {
    id: "ivo",
    name: "Ivo",
    short: "Ivo",
    initials: "IV",
    kind: "human",
    role: "Reviewer",
    color: "cyan",
    status: "online",
    since: "2025-06-03",
    contributions: 18,
  },
  {
    id: "atlas",
    name: "Atlas",
    short: "Atlas",
    initials: "AT",
    kind: "agent",
    role: "Executor",
    color: "cyan",
    status: "running",
    since: "2026-10-02",
    harness: "DSH",
    model: "deepseek-flash",
    contributions: 34,
    verified: 7,
    capabilities: ["shell", "filesystem", "git", "tests"],
    currentRunId: "RUN-014",
  },
  {
    id: "echo",
    name: "Echo",
    short: "Echo",
    initials: "EC",
    kind: "agent",
    role: "Researcher",
    color: "violet",
    status: "idle",
    since: "2026-10-11",
    harness: "DSH",
    model: "deepseek-flash",
    contributions: 21,
    verified: 4,
    capabilities: ["web", "read", "summarise", "cite"],
    currentRunId: null,
  },
  {
    id: "forge",
    name: "Forge",
    short: "Forge",
    initials: "FG",
    kind: "agent",
    role: "Builder",
    color: "rose",
    status: "idle",
    since: "2026-10-19",
    harness: "Local shell",
    model: "deepseek-flash",
    contributions: 9,
    verified: 2,
    capabilities: ["shell", "filesystem", "tests"],
    currentRunId: null,
  },
];

export const projects = [
  {
    id: "field-notes",
    name: "Field notes",
    purpose: "Make a season of research legible without replaying the conversations.",
    repo: "northstar/field-notes",
    branch: "main",
    environment: "Local workstation",
    ownerId: "mira",
    accent: "cyan",
    updatedAt: ago(12),
  },
  {
    id: "ledger",
    name: "Ledger",
    purpose: "Keep the record honest while the surface changes underneath it.",
    repo: "northstar/ledger",
    branch: "main",
    environment: "Local workstation",
    ownerId: "mira",
    accent: "violet",
    updatedAt: ago(160),
  },
  {
    id: "atlas",
    name: "Atlas",
    purpose: "A runtime for long-running agents with recoverable execution.",
    repo: "northstar/atlas",
    branch: "exp/recovery",
    environment: "Staging host",
    ownerId: "mira",
    accent: "gold",
    updatedAt: ago(600),
  },
];

export const objectives = [
  {
    id: "FN-001",
    projectId: "field-notes",
    title: "Index the field notes",
    intent:
      "Every note from the season is findable by project, contributor, and date, without moving the originals.",
    status: "claimed",
    ownerId: "atlas",
    authority: "Mira",
    priority: "urgent",
    createdAt: ago(620),
    updatedAt: ago(12),
    conditions: [
      "All 214 notes appear in the index",
      "Original files are untouched",
      "A missing note is reported, not skipped",
    ],
    evidence: [],
    contributions: [
      {
        id: "C-101",
        authorId: "atlas",
        kind: "proposal",
        body: "Index in place, originals addressed by content hash; missing notes reported as a gap list.",
        refs: ["path:index/manifest.json"],
        t: ago(31),
      },
      {
        id: "C-102",
        authorId: "atlas",
        kind: "observation",
        body: "Manifest lists 214 notes; 3 duplicate tags found in the source.",
        refs: [],
        t: ago(19),
      },
    ],
    runIds: ["RUN-014"],
    tags: ["retrieval", "index"],
  },
  {
    id: "FN-002",
    projectId: "field-notes",
    title: "Approve the retrieval plan",
    intent: "A person can explain why a result was returned from the record alone.",
    status: "verified",
    ownerId: "atlas",
    authority: "Mira",
    priority: "high",
    createdAt: ago(980),
    updatedAt: ago(240),
    conditions: ["The plan names its evidence", "A rejection keeps its reason"],
    evidence: [
      {
        id: "EV-001",
        objectiveId: "FN-002",
        byId: "ivo",
        refs: ["commit:8f2a1c4", "test:retrieval-plan"],
        note: "Three sample queries resolve to recorded evidence; a refusal keeps its reason.",
        t: ago(240),
      },
    ],
    contributions: [
      {
        id: "C-110",
        authorId: "atlas",
        kind: "proposal",
        body: "Retrieval returns the governing record, the matched contribution, and the source line.",
        refs: ["path:docs/retrieval.md"],
        t: ago(410),
      },
      {
        id: "C-111",
        authorId: "ivo",
        kind: "evidence",
        body: "Three sample queries resolve to recorded evidence; a refusal keeps its reason.",
        refs: ["commit:8f2a1c4", "test:retrieval-plan"],
        t: ago(240),
      },
    ],
    runIds: ["RUN-010"],
    tags: ["retrieval", "review"],
  },
  {
    id: "FN-003",
    projectId: "field-notes",
    title: "Consolidate duplicate tags",
    intent: "Two naming schemes collapse into one without losing the older aliases.",
    status: "parked",
    ownerId: "atlas",
    authority: "Mira",
    priority: "normal",
    createdAt: ago(700),
    updatedAt: ago(300),
    conditions: ["Aliases resolve", "No note changes project"],
    evidence: [],
    contributions: [
      {
        id: "C-120",
        authorId: "atlas",
        kind: "observation",
        body: "Three duplicate tags found; the source alias table is not exported yet.",
        refs: [],
        t: ago(300),
      },
    ],
    runIds: [],
    parkedCondition: "The alias table is exported by the source system.",
    tags: ["taxonomy"],
  },
  {
    id: "FN-004",
    projectId: "field-notes",
    title: "Publish the archive snapshot",
    intent: "A read-only copy leaves the machine with its evidence attached.",
    status: "blocked",
    ownerId: null,
    authority: "Mira",
    priority: "high",
    createdAt: ago(2_900),
    updatedAt: ago(1_500),
    conditions: ["Checksums match", "Access is read-only"],
    evidence: [],
    contributions: [],
    runIds: ["RUN-011"],
    blockedReason: "The archive host is not provisioned yet.",
    tags: ["delivery"],
  },
  {
    id: "FN-005",
    projectId: "field-notes",
    title: "Reconcile conflicting counts",
    intent: "The index count and the source count agree.",
    status: "rejected",
    ownerId: null,
    authority: "Mira",
    priority: "low",
    createdAt: ago(3_600),
    updatedAt: ago(3_200),
    conditions: ["Counts agree"],
    evidence: [],
    contributions: [],
    runIds: [],
    rejectionReason: "Out of scope: the source export is authoritative for this season.",
    tags: ["data"],
  },
  {
    id: "LG-001",
    projectId: "ledger",
    title: "Retire the scratch index",
    intent: "The first index is removed once the replacement is verified on the same corpus.",
    status: "accepted",
    ownerId: "atlas",
    authority: "Ivo",
    priority: "normal",
    createdAt: ago(2_000),
    updatedAt: ago(390),
    conditions: ["Same result count", "Removal is reversible for one week"],
    evidence: [
      {
        id: "EV-002",
        objectiveId: "LG-001",
        byId: "ivo",
        refs: ["commit:0d9e77b", "test:result-count"],
        note: "Result count is identical on the frozen corpus.",
        t: ago(390),
      },
    ],
    contributions: [
      {
        id: "C-130",
        authorId: "atlas",
        kind: "observation",
        body: "Result count is identical on the frozen corpus; removal is behind a one-week restore window.",
        refs: ["commit:0d9e77b"],
        t: ago(410),
      },
      {
        id: "C-131",
        authorId: "ivo",
        kind: "decision",
        body: "Accepted. The scratch index may be removed after a week.",
        refs: [],
        t: ago(390),
      },
    ],
    runIds: ["RUN-012"],
    decision: { byId: "ivo", note: "Accepted. The scratch index may be removed after a week.", t: ago(390) },
    tags: ["cleanup"],
  },
  {
    id: "LG-002",
    projectId: "ledger",
    title: "Add revision guards to the store",
    intent: "A stale writer is refused instead of silently overwriting a contribution.",
    status: "open",
    ownerId: null,
    authority: "Mira",
    priority: "urgent",
    createdAt: ago(260),
    updatedAt: ago(90),
    conditions: ["Every transition states the standing it read", "A stale write is refused"],
    evidence: [],
    contributions: [
      {
        id: "C-140",
        authorId: "echo",
        kind: "proposal",
        body: "Use a monotonic sequence plus an expected standing on every write; refuse the mismatch.",
        refs: ["path:docs/003-data-model.md"],
        t: ago(90),
      },
    ],
    runIds: [],
    tags: ["integrity"],
  },
  {
    id: "LG-003",
    projectId: "ledger",
    title: "Document the authority boundary",
    intent: "An adapter can name the scope it was granted and the point where it must stop.",
    status: "claimed",
    ownerId: "echo",
    authority: "Mira",
    priority: "high",
    createdAt: ago(600),
    updatedAt: ago(75),
    conditions: ["Names the grant", "Names the refusal point", "Includes one worked example"],
    evidence: [],
    contributions: [
      {
        id: "C-150",
        authorId: "echo",
        kind: "observation",
        body: "Draft covers reads, writes and deployment; the refusal point is still implicit.",
        refs: ["path:docs/drafts/authority.md"],
        t: ago(75),
      },
    ],
    runIds: ["RUN-013"],
    tags: ["docs", "authority"],
  },
  {
    id: "AT-001",
    projectId: "atlas",
    title: "Recover interrupted runs",
    intent: "A run interrupted at any step can be resumed without repeating a consequential action.",
    status: "open",
    ownerId: null,
    authority: "Mira",
    priority: "high",
    createdAt: ago(1_200),
    updatedAt: ago(600),
    conditions: ["Checkpoint before every side effect", "Resume reconciles the real state"],
    evidence: [],
    contributions: [],
    runIds: [],
    tags: ["runtime"],
  },
];

export const runs = [
  {
    id: "RUN-014",
    objectiveId: "FN-001",
    participantId: "atlas",
    status: "running",
    startedAt: ago(14),
    endedAt: null,
    harness: "DSH",
    grant: "FN-001 · objective scope",
    summary: "Build and verify the field-notes index.",
    events: [
      { t: ago(14), kind: "start", title: "Operation started", detail: "Scope: field-notes · grant FN-001", meta: "DSH · atlas" },
      { t: ago(13), kind: "tool", title: "List source notes", detail: "read · 214 files · 8.2 MB", meta: "12 ms" },
      { t: ago(11), kind: "tool", title: "Build content index", detail: "bash · sha256 manifest · originals untouched", meta: "2.4 s · exit 0" },
      { t: ago(8), kind: "checkpoint", title: "Checkpoint", detail: "214 / 214 notes indexed · snapshot 01", meta: "durable" },
      { t: ago(4), kind: "tool", title: "Verify originals untouched", detail: "test · manifest diff against source", meta: "0.8 s · exit 0" },
      { t: ago(1), kind: "artifact", title: "Artifact written", detail: "index/manifest.json", meta: "18 KB" },
    ],
    artifacts: [{ name: "index/manifest.json", meta: "18 KB" }],
    evidence: [],
  },
  {
    id: "RUN-013",
    objectiveId: "LG-003",
    participantId: "echo",
    status: "ended",
    startedAt: ago(95),
    endedAt: ago(82),
    harness: "DSH",
    grant: "LG-003 · objective scope",
    summary: "Draft the authority boundary from the existing records.",
    events: [
      { t: ago(95), kind: "start", title: "Operation started", detail: "Scope: ledger · grant LG-003", meta: "DSH · echo" },
      { t: ago(93), kind: "tool", title: "Read governing records", detail: "read · 12 documents · 2 refusals", meta: "40 ms" },
      { t: ago(88), kind: "tool", title: "Draft boundary section", detail: "write · docs/drafts/authority.md", meta: "1.1 s" },
      { t: ago(84), kind: "checkpoint", title: "Checkpoint", detail: "Draft complete; refusal point implicit", meta: "durable" },
      { t: ago(82), kind: "end", title: "Operation ended", detail: "Awaiting verification", meta: "13 min" },
    ],
    artifacts: [{ name: "docs/drafts/authority.md", meta: "6 KB" }],
    evidence: [],
  },
  {
    id: "RUN-012",
    objectiveId: "LG-001",
    participantId: "atlas",
    status: "ended",
    startedAt: ago(400),
    endedAt: ago(384),
    harness: "DSH",
    grant: "LG-001 · objective scope",
    summary: "Verify the replacement index on the frozen corpus.",
    events: [
      { t: ago(400), kind: "start", title: "Operation started", detail: "Scope: ledger · grant LG-001", meta: "DSH · atlas" },
      { t: ago(396), kind: "tool", title: "Freeze corpus", detail: "snapshot · 1,204 records", meta: "0.4 s" },
      { t: ago(390), kind: "tool", title: "Compare result counts", detail: "test · scratch vs replacement", meta: "exit 0" },
      { t: ago(386), kind: "checkpoint", title: "Checkpoint", detail: "Counts identical; restore window open", meta: "durable" },
      { t: ago(384), kind: "end", title: "Operation ended", detail: "Evidence attached by Ivo", meta: "16 min" },
    ],
    artifacts: [{ name: "test/result-count", meta: "passed" }],
    evidence: ["EV-002"],
  },
  {
    id: "RUN-011",
    objectiveId: "FN-004",
    participantId: "forge",
    status: "failed",
    startedAt: ago(1_500),
    endedAt: ago(1_488),
    harness: "Local shell",
    grant: "FN-004 · objective scope",
    summary: "Publish the archive snapshot to the read-only host.",
    events: [
      { t: ago(1_500), kind: "start", title: "Operation started", detail: "Scope: field-notes · grant FN-004", meta: "Local shell · forge" },
      { t: ago(1_496), kind: "tool", title: "Resolve archive host", detail: "ssh · archive.internal", meta: "no route" },
      { t: ago(1_488), kind: "error", title: "Operation failed", detail: "Archive host is not provisioned", meta: "exit 255" },
    ],
    artifacts: [],
    evidence: [],
    failure: "Archive host is not provisioned",
  },
  {
    id: "RUN-010",
    objectiveId: "FN-002",
    participantId: "atlas",
    status: "ended",
    startedAt: ago(300),
    endedAt: ago(288),
    harness: "DSH",
    grant: "FN-002 · objective scope",
    summary: "Exercise the retrieval plan against three sample queries.",
    events: [
      { t: ago(300), kind: "start", title: "Operation started", detail: "Scope: field-notes · grant FN-002", meta: "DSH · atlas" },
      { t: ago(296), kind: "tool", title: "Run sample queries", detail: "test · 3 queries", meta: "exit 0" },
      { t: ago(290), kind: "checkpoint", title: "Checkpoint", detail: "All queries resolve to source lines", meta: "durable" },
      { t: ago(288), kind: "end", title: "Operation ended", detail: "Evidence attached by Ivo", meta: "12 min" },
    ],
    artifacts: [{ name: "test/retrieval-plan", meta: "passed" }],
    evidence: ["EV-001"],
  },
];

export const evidence = [
  {
    id: "EV-001",
    objectiveId: "FN-002",
    byId: "ivo",
    refs: ["commit:8f2a1c4", "test:retrieval-plan"],
    note: "Three sample queries resolve to recorded evidence; a refusal keeps its reason.",
    t: ago(240),
  },
  {
    id: "EV-002",
    objectiveId: "LG-001",
    byId: "ivo",
    refs: ["commit:0d9e77b", "test:result-count"],
    note: "Result count is identical on the frozen corpus.",
    t: ago(390),
  },
];

export const activity = [
  { t: ago(1), actorId: "atlas", text: "wrote an artifact to", target: "FN-001", route: "objective/FN-001", kind: "artifact" },
  { t: ago(4), actorId: "atlas", text: "verified originals untouched on", target: "FN-001", route: "objective/FN-001", kind: "run" },
  { t: ago(8), actorId: "atlas", text: "wrote a checkpoint on", target: "FN-001", route: "run/RUN-014", kind: "checkpoint" },
  { t: ago(75), actorId: "echo", text: "left an observation on", target: "LG-003", route: "objective/LG-003", kind: "contribution" },
  { t: ago(82), actorId: "echo", text: "ended a run for", target: "LG-003", route: "run/RUN-013", kind: "run" },
  { t: ago(240), actorId: "ivo", text: "verified", target: "FN-002", route: "objective/FN-002", kind: "evidence" },
  { t: ago(288), actorId: "ivo", text: "attached evidence to", target: "FN-002", route: "objective/FN-002", kind: "evidence" },
  { t: ago(390), actorId: "ivo", text: "accepted", target: "LG-001", route: "objective/LG-001", kind: "decision" },
  { t: ago(1_488), actorId: "forge", text: "failed a run on", target: "FN-004", route: "run/RUN-011", kind: "error" },
];

export const STATUS = {
  open: { label: "Open", tone: "slate" },
  claimed: { label: "Claimed", tone: "cyan" },
  verified: { label: "Verified", tone: "green" },
  accepted: { label: "Accepted", tone: "gold" },
  blocked: { label: "Blocked", tone: "red" },
  parked: { label: "Parked", tone: "violet" },
  rejected: { label: "Rejected", tone: "rose" },
  running: { label: "Running", tone: "cyan" },
  ended: { label: "Ended", tone: "green" },
  failed: { label: "Failed", tone: "red" },
};

export const CONTRIBUTION = {
  proposal: { label: "Proposal", icon: "decisions" },
  observation: { label: "Observation", icon: "book" },
  evidence: { label: "Evidence", icon: "shield" },
  decision: { label: "Decision", icon: "check" },
  rejection: { label: "Rejection", icon: "alert" },
  commitment: { label: "Commitment", icon: "lock" },
};

export const byId = (list, id) => list.find((item) => item.id === id);
export const person = (id) => byId(people, id);
export const project = (id) => byId(projects, id);
export const objective = (id) => byId(objectives, id);
export const run = (id) => byId(runs, id);
export const evidenceFor = (objectiveId) => evidence.filter((item) => item.objectiveId === objectiveId);
export const objectivesForProject = (projectId) => objectives.filter((item) => item.projectId === projectId);
export const runsForProject = (projectId) => {
  const ids = new Set(objectivesForProject(projectId).map((item) => item.id));
  return runs.filter((item) => ids.has(item.objectiveId));
};
export const runsForObjective = (objectiveId) => runs.filter((item) => item.objectiveId === objectiveId);
export const currentRunFor = (personId) => runs.find((item) => item.participantId === personId && item.status === "running") || null;
export const needsYou = () => objectives.filter((item) => item.status === "verified" || item.status === "blocked");
export const activeRuns = () => runs.filter((item) => item.status === "running");

export function projectCounts(projectId) {
  const counts = { open: 0, claimed: 0, verified: 0, accepted: 0, blocked: 0, parked: 0, rejected: 0 };
  for (const item of objectivesForProject(projectId)) counts[item.status] += 1;
  return counts;
}

export function relative(iso) {
  if (!iso) return "—";
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86400)}d ago`;
}

export function elapsed(start, end) {
  const from = Date.parse(start);
  const to = end ? Date.parse(end) : Date.now();
  const minutes = Math.max(0, Math.round((to - from) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function proposals() {
  return objectives.flatMap((item) =>
    item.contributions
      .filter((contribution) => contribution.kind === "proposal")
      .map((contribution) => ({ ...contribution, objective: item })),
  );
}

/**
 * Illustrative content for `npm run demo`.
 *
 * Every record written here is marked illustrative by the store, and the
 * surface labels it. It never mixes with a real store.
 */
export function seedDemo(store) {
  const write = (actor, event) => store.append(actor, event);

  write("system", { kind: "workspace.created", name: "Northstar" });
  write("system", {
    kind: "participant.registered",
    participantId: "mira",
    name: "Mira",
    participantKind: "human",
    role: "Operator",
  });
  write("system", {
    kind: "participant.registered",
    participantId: "atlas",
    name: "Atlas",
    participantKind: "agent",
    role: "Executor",
  });
  write("system", {
    kind: "participant.registered",
    participantId: "ivo",
    name: "Ivo",
    participantKind: "human",
    role: "Reviewer",
  });
  write("mira", {
    kind: "project.created",
    name: "Field notes",
    purpose: "Make a season of research legible without replaying the conversations.",
  });
  write("mira", {
    kind: "project.created",
    name: "Ledger",
    purpose: "Keep the record honest while the surface changes underneath it.",
  });

  const field = "field-notes";
  const ledger = "ledger";

  write("mira", {
    kind: "objective.opened",
    projectId: field,
    title: "Index the field notes",
    intent:
      "Every note from the season is findable by project, contributor, and date, without moving the originals.",
    conditions: [
      "All 214 notes appear in the index",
      "Original files are untouched",
      "A missing note is reported, not skipped",
    ],
    authority: "Mira",
  });
  write("mira", {
    kind: "objective.opened",
    projectId: field,
    title: "Approve the retrieval plan",
    intent:
      "A person can explain why a result was returned from the record alone.",
    conditions: ["The plan names its evidence", "A rejection keeps its reason"],
    authority: "Mira",
  });
  write("mira", {
    kind: "objective.opened",
    projectId: field,
    title: "Consolidate duplicate tags",
    intent: "Two naming schemes collapse into one without losing the older aliases.",
    conditions: ["Aliases resolve", "No note changes project"],
    authority: "Mira",
  });
  write("mira", {
    kind: "objective.opened",
    projectId: field,
    title: "Publish the archive snapshot",
    intent: "A read-only copy leaves the machine with its evidence attached.",
    conditions: ["Checksums match", "Access is read-only"],
    authority: "Mira",
  });
  write("ivo", {
    kind: "objective.opened",
    projectId: ledger,
    title: "Retire the scratch index",
    intent: "The first index is removed once the replacement is verified on the same corpus.",
    conditions: ["Same result count", "Removal is reversible for one week"],
    authority: "Ivo",
  });

  // Claimed, awaiting evidence.
  write("atlas", { kind: "objective.claimed", objectiveId: "OBJ-001", by: "atlas", from: "open" });
  write("atlas", {
    kind: "contribution.added",
    objectiveId: "OBJ-001",
    author: "atlas",
    contributionKind: "proposal",
    body: "Index in place, originals addressed by content hash, missing notes reported as a gap list.",
  });

  // Verified by someone other than the owner, awaiting a person's acceptance.
  write("atlas", { kind: "objective.claimed", objectiveId: "OBJ-002", by: "atlas", from: "open" });
  write("atlas", {
    kind: "contribution.added",
    objectiveId: "OBJ-002",
    author: "atlas",
    contributionKind: "observation",
    body: "The plan is implemented against the three sample queries; all returned a source line.",
  });
  write("mira", {
    kind: "objective.verified",
    objectiveId: "OBJ-002",
    by: "mira",
    from: "claimed",
    refs: ["commit:8f2a1c4", "test:retrieval-plan"],
    note: "Three sample queries resolve to recorded evidence; a refusal keeps its reason.",
  });

  // Parked with an explicit reopening condition.
  write("atlas", { kind: "objective.claimed", objectiveId: "OBJ-003", by: "atlas", from: "open" });
  write("atlas", {
    kind: "objective.parked",
    objectiveId: "OBJ-003",
    by: "atlas",
    from: "claimed",
    condition: "The alias table is exported by the source system.",
  });

  // Blocked with a reason.
  write("mira", {
    kind: "objective.blocked",
    objectiveId: "OBJ-004",
    by: "mira",
    from: "open",
    reason: "The archive host is not provisioned yet.",
  });

  // Accepted: a full lifecycle.
  write("atlas", { kind: "objective.claimed", objectiveId: "OBJ-005", by: "atlas", from: "open" });
  write("mira", {
    kind: "objective.verified",
    objectiveId: "OBJ-005",
    by: "mira",
    from: "claimed",
    refs: ["commit:0d9e77b", "test:result-count"],
    note: "Result count is identical on the frozen corpus.",
  });
  write("ivo", {
    kind: "objective.accepted",
    objectiveId: "OBJ-005",
    by: "ivo",
    from: "verified",
    note: "Accepted. The scratch index may be removed after a week.",
  });
}

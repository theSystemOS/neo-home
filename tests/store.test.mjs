import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Store, StoreError } from "../server/store.mjs";

function fresh() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "neo-home-"));
  const file = path.join(dir, "records.jsonl");
  return { dir, file, store: new Store({ file }) };
}

function bootstrap(store) {
  store.append("system", { kind: "workspace.created", name: "Northstar" });
  store.append("system", {
    kind: "participant.registered",
    participantId: "mira",
    name: "Mira",
    participantKind: "human",
    role: "Operator",
  });
  store.append("system", {
    kind: "participant.registered",
    participantId: "atlas",
    name: "Atlas",
    participantKind: "agent",
    role: "Executor",
  });
  store.append("mira", { kind: "project.created", name: "Ledger" });
  const event = store.append("mira", {
    kind: "objective.opened",
    projectId: "ledger",
    title: "Index the notes",
    intent: "Every note is findable without moving the originals.",
    conditions: ["Counts match", "Originals untouched"],
    authority: "Mira",
  });
  return event.objectiveId;
}

test("bootstrap derives a workspace, participants, project, and objective", () => {
  const { store } = fresh();
  const id = bootstrap(store);
  const state = store.snapshot();
  assert.equal(state.workspace.name, "Northstar");
  assert.equal(state.participants.length, 2);
  assert.equal(state.projects.length, 1);
  assert.equal(state.objectives.length, 1);
  assert.equal(state.objectives[0].id, id);
  assert.equal(state.objectives[0].status, "open");
  assert.equal(state.integrity.events, 5);
});

test("a transition must state the standing it read", () => {
  const { store } = fresh();
  const id = bootstrap(store);
  assert.throws(
    () => store.append("atlas", { kind: "objective.claimed", objectiveId: id, by: "atlas" }),
    /must state the standing/,
  );
});

test("claim must name the writer and move from open", () => {
  const { store } = fresh();
  const id = bootstrap(store);
  assert.throws(
    () => store.append("atlas", { kind: "objective.claimed", objectiveId: id, by: "mira", from: "open" }),
    StoreError,
  );
  assert.throws(
    () => store.append("atlas", { kind: "objective.claimed", objectiveId: id, by: "atlas", from: "verified" }),
    /stale write/,
  );
  const claimed = store.append("atlas", { kind: "objective.claimed", objectiveId: id, by: "atlas", from: "open" });
  assert.equal(claimed.kind, "objective.claimed");
  assert.equal(store.snapshot().objectives[0].status, "claimed");
});

test("an owner cannot verify their own work", () => {
  const { store } = fresh();
  const id = bootstrap(store);
  store.append("atlas", { kind: "objective.claimed", objectiveId: id, by: "atlas", from: "open" });
  assert.throws(
    () =>
      store.append("atlas", {
        kind: "objective.verified",
        objectiveId: id,
        by: "atlas",
        from: "claimed",
        refs: ["commit:abc"],
      }),
    /owner cannot verify/,
  );
});

test("verification requires evidence and a different participant", () => {
  const { store } = fresh();
  const id = bootstrap(store);
  store.append("atlas", { kind: "objective.claimed", objectiveId: id, by: "atlas", from: "open" });
  assert.throws(
    () =>
      store.append("mira", {
        kind: "objective.verified",
        objectiveId: id,
        by: "mira",
        from: "claimed",
        refs: [],
      }),
    /evidence reference/,
  );
  const verified = store.append("mira", {
    kind: "objective.verified",
    objectiveId: id,
    by: "mira",
    from: "claimed",
    refs: ["commit:abc", "test:index"],
    note: "Counts match; originals untouched.",
  });
  assert.equal(verified.kind, "objective.verified");
  const objective = store.snapshot().objectives[0];
  assert.equal(objective.status, "verified");
  assert.equal(objective.evidence.length, 1);
  assert.equal(objective.evidence[0].refs.length, 2);
});

test("acceptance requires verification and a human", () => {
  const { store } = fresh();
  const id = bootstrap(store);
  store.append("atlas", { kind: "objective.claimed", objectiveId: id, by: "atlas", from: "open" });
  assert.throws(
    () =>
      store.append("mira", {
        kind: "objective.accepted",
        objectiveId: id,
        by: "mira",
        from: "claimed",
      }),
    /acceptance refused/,
  );
  store.append("mira", {
    kind: "objective.verified",
    objectiveId: id,
    by: "mira",
    from: "claimed",
    refs: ["test:index"],
  });
  assert.throws(
    () =>
      store.append("atlas", {
        kind: "objective.accepted",
        objectiveId: id,
        by: "atlas",
        from: "verified",
      }),
    /only a person/,
  );
  store.append("mira", {
    kind: "objective.accepted",
    objectiveId: id,
    by: "mira",
    from: "verified",
    note: "Accepted.",
  });
  assert.equal(store.snapshot().objectives[0].status, "accepted");
});

test("blocked, parked, and rejected objectives reopen with a reason", () => {
  const { store } = fresh();
  const id = bootstrap(store);
  store.append("mira", {
    kind: "objective.blocked",
    objectiveId: id,
    by: "mira",
    from: "open",
    reason: "Host not provisioned.",
  });
  assert.equal(store.snapshot().objectives[0].status, "blocked");
  assert.throws(
    () =>
      store.append("mira", {
        kind: "objective.reopened",
        objectiveId: id,
        by: "mira",
        from: "blocked",
      }),
    /reopen needs a reason/,
  );
  store.append("mira", {
    kind: "objective.reopened",
    objectiveId: id,
    by: "mira",
    from: "blocked",
    reason: "Host provisioned.",
  });
  assert.equal(store.snapshot().objectives[0].status, "open");
});

test("a contribution must be authored by the writer", () => {
  const { store } = fresh();
  const id = bootstrap(store);
  assert.throws(
    () =>
      store.append("atlas", {
        kind: "contribution.added",
        objectiveId: id,
        author: "mira",
        contributionKind: "proposal",
        body: "A possibility.",
      }),
    /author must be the participant/,
  );
});

test("the hash chain refuses a hand-edited record store", () => {
  const { file, store } = fresh();
  bootstrap(store);
  const raw = fs.readFileSync(file, "utf8");
  const lines = raw.split("\n").filter(Boolean);
  lines[0] = lines[0].replace("Northstar", "Northst4r");
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
  assert.throws(() => new Store({ file }), /hash mismatch|broken chain/);
});

test("a second writer re-reads the same store without losing history", () => {
  const { file, store } = fresh();
  const id = bootstrap(store);
  store.append("atlas", { kind: "objective.claimed", objectiveId: id, by: "atlas", from: "open" });
  const reopened = new Store({ file });
  assert.equal(reopened.snapshot().objectives[0].status, "claimed");
  assert.equal(reopened.snapshot().integrity.events, 6);
});

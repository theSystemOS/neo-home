import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * neo-home record store.
 *
 * The JSONL file is the only durable truth. Every line is one event; `prev`
 * points at the previous line's hash, so a hand edit is detectable. State is a
 * pure fold over the events. The store is the only writer and enforces every
 * standing rule at write time.
 */

export const PARTICIPANT_KINDS = ["human", "agent"];
export const CONTRIBUTION_KINDS = [
  "proposal",
  "commitment",
  "observation",
  "rejection",
  "decision",
];
export const OBJECTIVE_STATES = [
  "open",
  "claimed",
  "verified",
  "accepted",
  "blocked",
  "parked",
  "rejected",
];

const EVENT_KINDS = new Set([
  "workspace.created",
  "participant.registered",
  "project.created",
  "objective.opened",
  "objective.claimed",
  "contribution.added",
  "objective.verified",
  "objective.accepted",
  "objective.rejected",
  "objective.blocked",
  "objective.parked",
  "objective.reopened",
  "objective.revised",
  "operation.started",
  "operation.ended",
]);

export class StoreError extends Error {
  constructor(message) {
    super(message);
    this.name = "StoreError";
  }
}

/** Stable JSON: object keys sorted, so a hash never depends on key order. */
export function canonical(value) {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
    .join(",")}}`;
}

export function sha256(text) {
  return `sha256:${crypto.createHash("sha256").update(text).digest("hex")}`;
}

function eventHash(event) {
  const { hash: _ignored, ...rest } = event;
  return sha256(canonical(rest));
}

function slug(text, fallback = "item") {
  const value = String(text ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return value || fallback;
}

function uniqueId(base, taken) {
  if (!taken.has(base)) return base;
  let index = 2;
  while (taken.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function nextObjectiveId(state) {
  const taken = new Set(state.objectiveOrder);
  let index = state.objectiveOrder.length + 1;
  let id = `OBJ-${String(index).padStart(3, "0")}`;
  while (taken.has(id)) {
    index += 1;
    id = `OBJ-${String(index).padStart(3, "0")}`;
  }
  return id;
}

function assignIds(event, state) {
  const participants = new Set(state.participantOrder);
  const projects = new Set(state.projectOrder);
  if (event.kind === "workspace.created" && !event.workspaceId) {
    event.workspaceId = slug(event.name, "workspace");
  }
  if (event.kind === "participant.registered" && !event.participantId) {
    event.participantId = uniqueId(slug(event.name, "participant"), participants);
  }
  if (event.kind === "project.created" && !event.projectId) {
    event.projectId = uniqueId(slug(event.name, "project"), projects);
  }
  if (event.kind === "objective.opened" && !event.objectiveId) {
    event.objectiveId = nextObjectiveId(state);
  }
  if (event.kind === "contribution.added" && !event.contributionId) {
    event.contributionId = `C-${event.seq}`;
  }
  if (event.kind === "operation.started" && !event.operationId) {
    event.operationId = `OP-${state.operationOrder.length + 1}`;
  }
}

function now() {
  return new Date().toISOString();
}

function emptyState() {
  return {
    workspace: null,
    projects: {},
    projectOrder: [],
    participants: {},
    participantOrder: [],
    objectives: {},
    objectiveOrder: [],
    operations: {},
    operationOrder: [],
  };
}

function assertString(value, message) {
  if (typeof value !== "string" || !value.trim()) throw new StoreError(message);
  return value.trim();
}

export class Store {
  constructor({ file, demo = false }) {
    this.file = file;
    this.demo = demo;
    this.events = [];
    this.state = emptyState();
    this.createdFile = false;
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, "", { mode: 0o600 });
      this.createdFile = true;
    }
    this.load();
  }

  get isEmpty() {
    return this.events.length === 0;
  }

  load() {
    const raw = fs.readFileSync(this.file, "utf8");
    const lines = raw.split("\n").filter((line) => line.trim());
    const events = [];
    let prev = null;
    for (const [index, line] of lines.entries()) {
      let event;
      try {
        event = JSON.parse(line);
      } catch {
        throw new StoreError(`record store is corrupt at line ${index + 1}: not JSON`);
      }
      if (event.seq !== index + 1) {
        throw new StoreError(`record store is corrupt at line ${index + 1}: sequence mismatch`);
      }
      if (event.prev !== prev) {
        throw new StoreError(`record store is corrupt at line ${index + 1}: broken chain`);
      }
      if (event.hash !== eventHash(event)) {
        throw new StoreError(`record store is corrupt at line ${index + 1}: hash mismatch`);
      }
      prev = event.hash;
      events.push(event);
    }
    this.events = events;
    this.state = this.fold(events);
  }

  /** Append one event. Returns the stored event; refuses illegal writes. */
  append(actor, input) {
    if (!input || typeof input !== "object" || typeof input.kind !== "string") {
      throw new StoreError("event needs a kind");
    }
    if (!EVENT_KINDS.has(input.kind)) {
      throw new StoreError(`unknown event kind: ${input.kind}`);
    }
    const clean = { ...input };
    delete clean.seq;
    delete clean.t;
    delete clean.hash;
    delete clean.prev;
    delete clean.illustrative;
    clean.actor = actor || clean.actor || "";
    const event = {
      seq: this.events.length + 1,
      t: now(),
      ...clean,
      illustrative: this.demo,
    };
    event.actor = String(event.actor || "system");
    assignIds(event, this.state);
    const refusal = check(this.state, event, this.demo);
    if (refusal) throw new StoreError(refusal);
    event.prev = this.events.at(-1)?.hash ?? null;
    event.hash = eventHash(event);
    fs.appendFileSync(this.file, `${JSON.stringify(event)}\n`, { mode: 0o600 });
    this.events.push(event);
    this.state = this.fold(this.events);
    return event;
  }

  fold(events) {
    const state = emptyState();
    const log = [];
    const bump = (id, field) => {
      if (state.participants[id]) state.participants[id][field] += 1;
    };
    const actorName = (id) => state.participants[id]?.name || id || "system";

    for (const event of events) {
      const objective = event.objectiveId ? state.objectives[event.objectiveId] : null;
      switch (event.kind) {
        case "workspace.created":
          state.workspace = {
            id: event.workspaceId,
            name: event.name,
            createdAt: event.t,
          };
          log.push({ seq: event.seq, t: event.t, kind: event.kind, actor: event.actor,
            actorName: actorName(event.actor), summary: `Workspace “${event.name}” created.` });
          break;
        case "participant.registered":
          state.participants[event.participantId] = {
            id: event.participantId,
            name: event.name,
            kind: event.participantKind,
            role: event.role || "",
            createdAt: event.t,
            contributions: 0,
            owns: 0,
            verified: 0,
          };
          state.participantOrder.push(event.participantId);
          log.push({ seq: event.seq, t: event.t, kind: event.kind, actor: event.actor,
            actorName: actorName(event.actor), summary: `${event.name} joined as ${event.participantKind === "human" ? "a person" : "an agent"}.` });
          break;
        case "project.created":
          state.projects[event.projectId] = {
            id: event.projectId,
            name: event.name,
            purpose: event.purpose || "",
            createdAt: event.t,
          };
          state.projectOrder.push(event.projectId);
          log.push({ seq: event.seq, t: event.t, kind: event.kind, actor: event.actor,
            actorName: actorName(event.actor), summary: `Project “${event.name}” opened.` });
          break;
        case "objective.opened":
          state.objectives[event.objectiveId] = {
            id: event.objectiveId,
            projectId: event.projectId,
            title: event.title,
            intent: event.intent,
            conditions: Array.isArray(event.conditions) ? event.conditions.filter(Boolean) : [],
            authority: event.authority,
            status: "open",
            owner: null,
            createdAt: event.t,
            updatedAt: event.t,
            claimedAt: null,
            verifiedAt: null,
            acceptedAt: null,
            block: null,
            park: null,
            rejection: null,
            reopen: null,
            evidence: [],
            contributions: [],
            operations: [],
            revisions: [],
          };
          state.objectiveOrder.push(event.objectiveId);
          log.push({ seq: event.seq, t: event.t, kind: event.kind, actor: event.actor,
            actorName: actorName(event.actor), summary: `Objective opened: ${event.title}.` });
          break;
        case "objective.claimed":
          objective.status = "claimed";
          objective.owner = event.by;
          objective.claimedAt = event.t;
          objective.updatedAt = event.t;
          bump(event.by, "owns");
          log.push({ seq: event.seq, t: event.t, kind: event.kind, actor: event.actor,
            actorName: actorName(event.actor), summary: `${actorName(event.by)} claimed ${objective.id} · ${objective.title}.` });
          break;
        case "contribution.added": {
          const contribution = {
            id: event.contributionId,
            author: event.author,
            kind: event.contributionKind,
            body: event.body,
            refs: Array.isArray(event.refs) ? event.refs : [],
            t: event.t,
          };
          objective.contributions.push(contribution);
          objective.updatedAt = event.t;
          bump(event.author, "contributions");
          log.push({ seq: event.seq, t: event.t, kind: event.kind, actor: event.actor,
            actorName: actorName(event.actor), summary: `${actorName(event.author)} added a ${contribution.kind} to ${objective.id}.` });
          break;
        }
        case "objective.verified": {
          objective.status = "verified";
          objective.verifiedAt = event.t;
          objective.updatedAt = event.t;
          const evidence = {
            id: `E-${event.seq}`,
            by: event.by,
            refs: event.refs,
            note: event.note || "",
            t: event.t,
          };
          objective.evidence.push(evidence);
          objective.contributions.push({
            id: `C-${event.seq}`,
            author: event.by,
            kind: "evidence",
            body: event.note || "Evidence attached.",
            refs: event.refs,
            t: event.t,
          });
          bump(event.by, "verified");
          bump(event.by, "contributions");
          log.push({ seq: event.seq, t: event.t, kind: event.kind, actor: event.actor,
            actorName: actorName(event.actor), summary: `${actorName(event.by)} verified ${objective.id} with ${event.refs.length} reference${event.refs.length === 1 ? "" : "s"}.` });
          break;
        }
        case "objective.accepted":
          objective.status = "accepted";
          objective.acceptedAt = event.t;
          objective.updatedAt = event.t;
          objective.decision = { by: event.by, note: event.note || "", t: event.t };
          objective.contributions.push({
            id: `C-${event.seq}`,
            author: event.by,
            kind: "decision",
            body: event.note || "Accepted.",
            refs: [],
            t: event.t,
          });
          bump(event.by, "contributions");
          log.push({ seq: event.seq, t: event.t, kind: event.kind, actor: event.actor,
            actorName: actorName(event.actor), summary: `${actorName(event.by)} accepted ${objective.id}.` });
          break;
        case "objective.rejected":
          objective.status = "rejected";
          objective.rejection = { by: event.by, reason: event.reason, t: event.t };
          objective.updatedAt = event.t;
          objective.contributions.push({
            id: `C-${event.seq}`,
            author: event.by,
            kind: "rejection",
            body: event.reason,
            refs: [],
            t: event.t,
          });
          bump(event.by, "contributions");
          log.push({ seq: event.seq, t: event.t, kind: event.kind, actor: event.actor,
            actorName: actorName(event.actor), summary: `${actorName(event.by)} rejected ${objective.id}: ${event.reason}` });
          break;
        case "objective.blocked":
          objective.status = "blocked";
          objective.block = { by: event.by, reason: event.reason, t: event.t };
          objective.updatedAt = event.t;
          log.push({ seq: event.seq, t: event.t, kind: event.kind, actor: event.actor,
            actorName: actorName(event.actor), summary: `${objective.id} blocked: ${event.reason}` });
          break;
        case "objective.parked":
          objective.status = "parked";
          objective.park = { by: event.by, condition: event.condition, t: event.t };
          objective.updatedAt = event.t;
          log.push({ seq: event.seq, t: event.t, kind: event.kind, actor: event.actor,
            actorName: actorName(event.actor), summary: `${objective.id} parked until: ${event.condition}` });
          break;
        case "objective.reopened":
          objective.status = "open";
          objective.owner = null;
          objective.block = null;
          objective.park = null;
          objective.rejection = null;
          objective.reopen = { by: event.by, reason: event.reason, t: event.t };
          objective.updatedAt = event.t;
          log.push({ seq: event.seq, t: event.t, kind: event.kind, actor: event.actor,
            actorName: actorName(event.actor), summary: `${objective.id} reopened: ${event.reason}` });
          break;
        case "objective.revised":
          objective.intent = event.intent;
          objective.revisions.push({ by: event.by, intent: event.intent, t: event.t });
          objective.updatedAt = event.t;
          log.push({ seq: event.seq, t: event.t, kind: event.kind, actor: event.actor,
            actorName: actorName(event.actor), summary: `${actorName(event.by)} revised the intent of ${objective.id}.` });
          break;
        case "operation.started":
          state.operations[event.operationId] = {
            id: event.operationId,
            objectiveId: event.objectiveId,
            by: event.by,
            summary: event.summary || "",
            status: "running",
            startedAt: event.t,
            endedAt: null,
          };
          state.operationOrder.push(event.operationId);
          objective.operations.push(event.operationId);
          bump(event.by, "owns");
          log.push({ seq: event.seq, t: event.t, kind: event.kind, actor: event.actor,
            actorName: actorName(event.actor), summary: `${actorName(event.by)} started an operation on ${objective.id}.` });
          break;
        case "operation.ended": {
          const operation = state.operations[event.operationId];
          if (operation) {
            operation.status = event.status;
            operation.endedAt = event.t;
            operation.summary = event.summary || operation.summary;
          }
          log.push({ seq: event.seq, t: event.t, kind: event.kind, actor: event.actor,
            actorName: actorName(event.actor), summary: `${event.operationId} ${event.status}.` });
          break;
        }
        default:
          break;
      }
      if (objective) objective.updatedAt = event.t;
    }

    const objectivesAll = state.objectiveOrder.map((id) => state.objectives[id]);
    const participantList = state.participantOrder.map((id) => {
      const participant = state.participants[id];
      const owns = objectivesAll.filter(
        (objective) =>
          objective.owner === id &&
          !["accepted", "rejected", "parked", "blocked"].includes(objective.status),
      ).length;
      const verified = objectivesAll.filter((objective) =>
        objective.evidence.some((evidence) => evidence.by === id),
      ).length;
      return { ...participant, owns, verified };
    });
    const projectList = state.projectOrder.map((id) => {
      const project = state.projects[id];
      return {
        ...project,
        objectiveCount: state.objectiveOrder.filter(
          (objectiveId) => state.objectives[objectiveId].projectId === id,
        ).length,
      };
    });
    const objectiveList = state.objectiveOrder.map((id) => {
      const objective = state.objectives[id];
      return {
        ...objective,
        contributions: objective.contributions.slice().sort((a, b) => a.t.localeCompare(b.t)),
      };
    });

    return {
      ...state,
      participantList,
      projectList,
      objectiveList,
      log,
      counts: {
        events: events.length,
        objectives: objectiveList.length,
        participants: participantList.length,
        projects: projectList.length,
      },
    };
  }

  /** Public, serializable view for the HTTP API. */
  snapshot() {
    const state = this.state;
    return {
      demo: this.demo,
      integrity: {
        ok: true,
        events: this.events.length,
        head: this.events.at(-1)?.hash ?? null,
      },
      workspace: state.workspace,
      participants: state.participantList,
      projects: state.projectList,
      objectives: state.objectiveList,
      log: state.log.slice(-40),
      counts: state.counts,
    };
  }
}

/**
 * Write-time rules. Kept as one function so every writer is checked in one place.
 */
export function check(state, event, demo = false) {
  if (!EVENT_KINDS.has(event.kind)) return `unknown event kind: ${event.kind}`;
  const registered = (id) => Boolean(id && state.participants[id]);

  if (event.kind === "workspace.created") {
    if (state.workspace) return "a workspace already exists";
    if (!event.name || !String(event.name).trim()) return "workspace needs a name";
    return null;
  }

  if (event.kind === "participant.registered") {
    if (!event.participantId) return "participant needs an id";
    if (state.participants[event.participantId]) return "participant id is taken";
    if (!event.name || !String(event.name).trim()) return "participant needs a name";
    if (!PARTICIPANT_KINDS.includes(event.participantKind)) return "participant kind must be human or agent";
    return null;
  }

  if (!state.workspace) return "create a workspace first";

  if (event.kind === "project.created") {
    if (!event.projectId) return "project needs an id";
    if (state.projects[event.projectId]) return "project id is taken";
    if (!event.name || !String(event.name).trim()) return "project needs a name";
    return null;
  }

  if (event.kind === "objective.opened") {
    if (!event.objectiveId) return "objective needs an id";
    if (state.objectives[event.objectiveId]) return "objective id is taken";
    if (!state.projects[event.projectId]) return "objective needs an existing project";
    if (!event.title || !String(event.title).trim()) return "objective needs a title";
    if (!event.intent || !String(event.intent).trim()) return "objective needs an intent";
    if (!event.authority || !String(event.authority).trim()) return "objective needs an authority";
    return null;
  }

  if (!registered(event.actor)) return "writes must come from a registered participant";

  const objective = event.objectiveId ? state.objectives[event.objectiveId] : null;
  if (!objective) return "objective not found";

  const from = (expected) => {
    if (!event.from) return "this write must state the standing it read in `from`";
    if (event.from !== expected) {
      return `stale write: objective is ${expected}, not ${event.from}`;
    }
    return null;
  };

  switch (event.kind) {
    case "objective.claimed": {
      if (objective.status !== "open") return `claim refused: objective is ${objective.status}`;
      if (event.by !== event.actor) return "claim must name the participant writing";
      return from("open");
    }
    case "contribution.added": {
      if (!CONTRIBUTION_KINDS.includes(event.contributionKind)) return "unknown contribution kind";
      if (!event.body || !String(event.body).trim()) return "contribution needs a body";
      if (event.author !== event.actor) return "contribution author must be the participant writing";
      if (["accepted", "rejected"].includes(objective.status)) return `contributions are closed while ${objective.status}`;
      return null;
    }
    case "objective.verified": {
      if (objective.status !== "claimed") return `verification refused: objective is ${objective.status}`;
      if (event.by !== event.actor) return "verifier must be the participant writing";
      if (!registered(event.by)) return "verifier must be a registered participant";
      if (objective.owner === event.by) return "verification refused: an owner cannot verify their own work";
      if (!Array.isArray(event.refs) || !event.refs.length) return "verification refused: at least one evidence reference is required";
      return from("claimed");
    }
    case "objective.accepted": {
      if (objective.status !== "verified") return `acceptance refused: objective is ${objective.status}`;
      if (!registered(event.by)) return "acceptor must be a registered participant";
      if (state.participants[event.by].kind !== "human") return "acceptance refused: only a person can accept";
      if (event.by !== event.actor) return "acceptor must be the participant writing";
      return from("verified");
    }
    case "objective.rejected": {
      if (!["open", "claimed", "verified"].includes(objective.status)) return `rejection refused: objective is ${objective.status}`;
      if (!event.reason || !String(event.reason).trim()) return "rejection needs a reason";
      if (event.by !== event.actor) return "rejector must be the participant writing";
      return from(objective.status);
    }
    case "objective.blocked": {
      if (!["open", "claimed", "verified"].includes(objective.status)) return `block refused: objective is ${objective.status}`;
      if (!event.reason || !String(event.reason).trim()) return "a block needs a reason";
      if (event.by !== event.actor) return "blocker must be the participant writing";
      return from(objective.status);
    }
    case "objective.parked": {
      if (!["open", "claimed"].includes(objective.status)) return `park refused: objective is ${objective.status}`;
      if (!event.condition || !String(event.condition).trim()) return "parking needs a reopening condition";
      if (event.by !== event.actor) return "parker must be the participant writing";
      return from(objective.status);
    }
    case "objective.reopened": {
      if (!["blocked", "parked", "rejected"].includes(objective.status)) return `reopen refused: objective is ${objective.status}`;
      if (!event.reason || !String(event.reason).trim()) return "a reopen needs a reason";
      if (event.by !== event.actor) return "reopener must be the participant writing";
      return from(objective.status);
    }
    case "objective.revised": {
      if (!["open", "claimed"].includes(objective.status)) return `revision refused: objective is ${objective.status}`;
      if (!event.intent || !String(event.intent).trim()) return "revision needs the new intent";
      if (event.by !== event.actor) return "reviser must be the participant writing";
      return from(objective.status);
    }
    case "operation.started": {
      if (!event.operationId) return "operation needs an id";
      if (state.operations[event.operationId]) return "operation id is taken";
      if (["accepted", "rejected"].includes(objective.status)) return `operation refused: objective is ${objective.status}`;
      if (event.by !== event.actor) return "operator must be the participant writing";
      return null;
    }
    case "operation.ended": {
      const operation = state.operations[event.operationId];
      if (!operation) return "no such operation";
      if (!["ended", "failed"].includes(event.status)) return "operation status must be ended or failed";
      if (event.by !== event.actor) return "operator must be the participant writing";
      return null;
    }
    default:
      return `unhandled event kind: ${event.kind}`;
  }
}

export function createStore({ file, demo = false }) {
  return new Store({ file, demo });
}

export const _internal = { slug, uniqueId, emptyState, eventHash, assertString, now };

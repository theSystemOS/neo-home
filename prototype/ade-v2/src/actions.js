import {
  activity,
  evidence,
  objectives,
  people,
  projects,
  runs,
  workspace,
} from "./data.js";
import { bump } from "./store.js";

const now = () => new Date().toISOString();

function log(actorId, text, target, route, kind) {
  activity.unshift({ t: now(), actorId, text, target, route, kind });
}

function nextContributionId() {
  return `C-${String(Date.now()).slice(-6)}`;
}

function nextEvidenceId() {
  const highest = evidence.reduce((max, item) => Math.max(max, Number(String(item.id).replace(/\D/g, "")) || 0), 0);
  return `EV-${String(highest + 1).padStart(3, "0")}`;
}

function touch(objective) {
  objective.updatedAt = now();
}

export function claimObjective(id, actorId = "mira") {
  const item = objectives.find((candidate) => candidate.id === id);
  if (!item) return null;
  item.status = "claimed";
  item.ownerId = actorId;
  touch(item);
  log(actorId, "claimed", id, `objective/${id}`, "claim");
  bump();
  return item;
}

export function addContribution(id, { authorId = "mira", kind = "proposal", body, refs = [] }) {
  const item = objectives.find((candidate) => candidate.id === id);
  if (!item) return null;
  item.contributions.push({ id: nextContributionId(), authorId, kind, body, refs, t: now() });
  touch(item);
  log(authorId, `added a ${kind} to`, id, `objective/${id}`, "contribution");
  bump();
  return item;
}

export function verifyObjective(id, { byId = "mira", refs = [], note = "" } = {}) {
  const item = objectives.find((candidate) => candidate.id === id);
  if (!item) return null;
  const record = { id: nextEvidenceId(), objectiveId: id, byId, refs, note, t: now() };
  evidence.push(record);
  item.evidence.push(record);
  item.contributions.push({ id: nextContributionId(), authorId: byId, kind: "evidence", body: note || "Evidence attached.", refs, t: now() });
  item.status = "verified";
  touch(item);
  log(byId, "verified", id, `objective/${id}`, "evidence");
  bump();
  return record;
}

export function acceptObjective(id, { byId = "mira", note = "" } = {}) {
  const item = objectives.find((candidate) => candidate.id === id);
  if (!item) return null;
  item.status = "accepted";
  item.decision = { byId, note, t: now() };
  item.contributions.push({ id: nextContributionId(), authorId: byId, kind: "decision", body: note || "Accepted.", refs: [], t: now() });
  touch(item);
  log(byId, "accepted", id, `objective/${id}`, "decision");
  bump();
  return item;
}

export function rejectObjective(id, { byId = "mira", reason = "" } = {}) {
  const item = objectives.find((candidate) => candidate.id === id);
  if (!item) return null;
  item.status = "rejected";
  item.rejectionReason = reason;
  item.contributions.push({ id: nextContributionId(), authorId: byId, kind: "rejection", body: reason, refs: [], t: now() });
  touch(item);
  log(byId, "rejected", id, `objective/${id}`, "rejection");
  bump();
  return item;
}

export function blockObjective(id, { byId = "mira", reason = "" } = {}) {
  const item = objectives.find((candidate) => candidate.id === id);
  if (!item) return null;
  item.status = "blocked";
  item.blockedReason = reason;
  touch(item);
  log(byId, "blocked", id, `objective/${id}`, "block");
  bump();
  return item;
}

export function parkObjective(id, { byId = "mira", condition = "" } = {}) {
  const item = objectives.find((candidate) => candidate.id === id);
  if (!item) return null;
  item.status = "parked";
  item.parkedCondition = condition;
  touch(item);
  log(byId, "parked", id, `objective/${id}`, "park");
  bump();
  return item;
}

export function reopenObjective(id, { byId = "mira", reason = "" } = {}) {
  const item = objectives.find((candidate) => candidate.id === id);
  if (!item) return null;
  item.status = "open";
  item.ownerId = null;
  delete item.blockedReason;
  delete item.parkedCondition;
  delete item.rejectionReason;
  touch(item);
  log(byId, "reopened", id, `objective/${id}`, "reopen");
  bump();
  return item;
}

export function reviseObjective(id, { byId = "mira", intent = "" } = {}) {
  const item = objectives.find((candidate) => candidate.id === id);
  if (!item) return null;
  item.intent = intent;
  touch(item);
  log(byId, "revised the intent of", id, `objective/${id}`, "revise");
  bump();
  return item;
}

export function createObjective({ projectId, title, intent, conditions = [], priority = "normal", authority = "Mira" }) {
  const prefix = { "field-notes": "FN", ledger: "LG", atlas: "AT" }[projectId] || "OBJ";
  const highest = objectives
    .filter((item) => item.projectId === projectId)
    .reduce((max, item) => Math.max(max, Number(item.id.split("-")[1]) || 0), 0);
  const id = `${prefix}-${String(highest + 1).padStart(3, "0")}`;
  const item = {
    id,
    projectId,
    title,
    intent,
    status: "open",
    ownerId: null,
    authority,
    priority,
    createdAt: now(),
    updatedAt: now(),
    conditions,
    evidence: [],
    contributions: [],
    runIds: [],
    tags: [],
  };
  objectives.push(item);
  log("mira", "opened", id, `objective/${id}`, "open");
  bump();
  return item;
}

export function createProject({ name, purpose = "", repo = "", environment = "Local workstation" }) {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `project-${projects.length + 1}`;
  const item = {
    id,
    name,
    purpose,
    repo: repo || `northstar/${id}`,
    branch: "main",
    environment,
    ownerId: workspace.operatorId,
    accent: "cyan",
    updatedAt: now(),
  };
  projects.push(item);
  log("mira", "opened", id, `project/${id}`, "project");
  bump();
  return item;
}

export function addParticipant({ name, kind = "agent", role = "Executor", harness = "DSH" }) {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `participant-${people.length + 1}`;
  const participant = {
    id,
    name,
    short: name.split(" ")[0],
    initials: name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    kind,
    role,
    color: kind === "agent" ? "cyan" : "gold",
    status: "idle",
    since: now(),
    harness: kind === "agent" ? harness : undefined,
    contributions: 0,
    verified: 0,
    capabilities: kind === "agent" ? ["read"] : [],
    currentRunId: null,
  };
  people.push(participant);
  log("mira", "added", id, `agent/${id}`, "participant");
  bump();
  return participant;
}

export function delegate(objectiveId, participantId) {
  const item = objectives.find((candidate) => candidate.id === objectiveId);
  if (!item) return null;
  item.ownerId = participantId;
  item.status = "claimed";
  touch(item);
  log(participantId, "was assigned", objectiveId, `objective/${objectiveId}`, "delegate");
  bump();
  return item;
}

export function resetPrototype() {
  location.reload();
}

export { runs };

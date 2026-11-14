import { openModal, toast, prototypeToast } from "./overlays.js";
import { navigate } from "./router.js";
import {
  acceptObjective,
  addContribution,
  addParticipant,
  blockObjective,
  claimObjective,
  createObjective,
  createProject,
  delegate,
  parkObjective,
  rejectObjective,
  reopenObjective,
  reviseObjective,
  verifyObjective,
} from "./actions.js";
import { projects } from "./data.js";

export function claimFlow(item) {
  claimObjective(item.id);
  prototypeToast(`${item.id} is now claimed by Mira`);
}

export function contributionFlow(item) {
  openModal({
    title: "Add a contribution",
    sub: "A proposal adds a possibility. A commitment records a decision. An observation records what was seen.",
    fields: [
      { name: "kind", label: "Kind", type: "select", options: ["proposal", "observation", "commitment"], value: "proposal" },
      { name: "body", label: "Contribution", type: "textarea", placeholder: "What are you adding?" },
      { name: "refs", label: "References · one per line", type: "textarea", placeholder: "path:src/index.ts" },
    ],
    submit: "Add contribution",
    onSubmit: ({ kind, body, refs }) => {
      if (!body.trim()) {
        toast({ title: "Needs a body", body: "A contribution without content is not a contribution.", tone: "red" });
        return false;
      }
      addContribution(item.id, {
        kind,
        body,
        refs: refs.split(/\n+/).map((line) => line.trim()).filter(Boolean),
      });
      prototypeToast(`A ${kind} was added to ${item.id}`);
      return true;
    },
  });
}

export function verifyFlow(item) {
  openModal({
    title: "Attach evidence",
    sub: "At least one reference is required. Evidence supports a claim; it does not grant permission to act.",
    fields: [
      { name: "refs", label: "Evidence references · one per line", type: "textarea", placeholder: "commit:8f2a1c4\ntest:retrieval-plan" },
      { name: "note", label: "What the evidence shows", type: "textarea", placeholder: "The three sample queries resolve to recorded evidence." },
    ],
    submit: "Verify",
    onSubmit: ({ refs, note }) => {
      const list = refs.split(/\n+/).map((line) => line.trim()).filter(Boolean);
      if (!list.length) {
        toast({ title: "Evidence required", body: "A claim is not a verification. Add at least one reference.", tone: "red" });
        return false;
      }
      verifyObjective(item.id, { refs: list, note });
      prototypeToast(`${item.id} is now verified`);
      return true;
    },
  });
}

export function acceptFlow(item) {
  openModal({
    title: "Accept this objective",
    sub: "Acceptance records that a person with authority decided. It does not turn evidence into permission for anything else.",
    fields: [{ name: "note", label: "Decision note", type: "textarea", placeholder: "Accepted. The work may be used for the next project." }],
    submit: "Accept",
    submitTone: "primary",
    onSubmit: ({ note }) => {
      acceptObjective(item.id, { note });
      prototypeToast(`${item.id} is accepted`);
      return true;
    },
  });
}

export function rejectFlow(item) {
  openModal({
    title: "Reject this objective",
    sub: "A rejection keeps its reason so the path does not resurface unexplained.",
    fields: [{ name: "reason", label: "Reason", type: "textarea", placeholder: "Out of scope for this project." }],
    submit: "Reject",
    submitTone: "danger",
    onSubmit: ({ reason }) => {
      if (!reason.trim()) {
        toast({ title: "Reason required", body: "A rejection without a reason will resurface.", tone: "red" });
        return false;
      }
      rejectObjective(item.id, { reason });
      prototypeToast(`${item.id} is rejected`);
      return true;
    },
  });
}

export function blockFlow(item) {
  openModal({
    title: "Block this objective",
    sub: "A block names what prevents progress. It stays visible until someone reopens it with a reason.",
    fields: [{ name: "reason", label: "Reason", type: "textarea", placeholder: "The archive host is not provisioned." }],
    submit: "Block",
    submitTone: "danger",
    onSubmit: ({ reason }) => {
      if (!reason.trim()) {
        toast({ title: "Reason required", body: "An unexplained block cannot be resolved.", tone: "red" });
        return false;
      }
      blockObjective(item.id, { reason });
      prototypeToast(`${item.id} is blocked`);
      return true;
    },
  });
}

export function parkFlow(item) {
  openModal({
    title: "Park this objective",
    sub: "Parking keeps an alternative with the condition that would reopen it.",
    fields: [{ name: "condition", label: "Reopen when", type: "textarea", placeholder: "The source system exports its alias table." }],
    submit: "Park",
    onSubmit: ({ condition }) => {
      if (!condition.trim()) {
        toast({ title: "Condition required", body: "A parked path needs a reopening condition.", tone: "red" });
        return false;
      }
      parkObjective(item.id, { condition });
      prototypeToast(`${item.id} is parked`);
      return true;
    },
  });
}

export function reopenFlow(item) {
  openModal({
    title: "Reopen this objective",
    sub: "The prior standing stays in the log. The objective returns to open and must be claimed again.",
    fields: [{ name: "reason", label: "What changed", type: "textarea", placeholder: "The archive host is provisioned." }],
    submit: "Reopen",
    onSubmit: ({ reason }) => {
      if (!reason.trim()) {
        toast({ title: "Reason required", body: "A reopen needs a reason.", tone: "red" });
        return false;
      }
      reopenObjective(item.id, { reason });
      prototypeToast(`${item.id} is open again`);
      return true;
    },
  });
}

export function reviseFlow(item) {
  openModal({
    title: "Revise the intent",
    sub: "A revision announces itself in the log and names the work it affects.",
    fields: [{ name: "intent", label: "New intent", type: "textarea", value: item.intent }],
    submit: "Revise",
    onSubmit: ({ intent }) => {
      if (!intent.trim()) {
        toast({ title: "Intent required", body: "A revision needs the new direction.", tone: "red" });
        return false;
      }
      reviseObjective(item.id, { intent });
      prototypeToast(`${item.id} has a revised intent`);
      return true;
    },
  });
}

export function newObjectiveFlow(defaultProjectId) {
  openModal({
    title: "Open an objective",
    sub: "An objective records a direction, its authority, and the conditions under which it is done.",
    fields: [
      {
        name: "projectId",
        label: "Project",
        type: "select",
        options: projects.map((item) => ({ value: item.id, label: item.name })),
        value: defaultProjectId || projects[0]?.id,
      },
      { name: "title", label: "Title", type: "text", placeholder: "Index the field notes" },
      { name: "intent", label: "Intent", type: "textarea", placeholder: "Every note is findable without moving the originals." },
      { name: "conditions", label: "Done when · one per line", type: "textarea", placeholder: "All notes appear\nOriginals untouched" },
      { name: "priority", label: "Priority", type: "select", options: ["normal", "high", "urgent"], value: "normal" },
    ],
    submit: "Open objective",
    onSubmit: ({ projectId, title, intent, conditions, priority }) => {
      if (!title.trim() || !intent.trim()) {
        toast({ title: "Title and intent required", body: "An objective is a direction, not a label.", tone: "red" });
        return false;
      }
      const item = createObjective({
        projectId,
        title,
        intent,
        conditions: conditions.split(/\n+/).map((line) => line.trim()).filter(Boolean),
        priority,
      });
      prototypeToast(`${item.id} opened`);
      navigate(`/objective/${item.id}`);
      return true;
    },
  });
}

export function newProjectFlow() {
  openModal({
    title: "Open a project",
    sub: "A project carries a continuing objective and its material.",
    fields: [
      { name: "name", label: "Name", type: "text", placeholder: "Atlas" },
      { name: "purpose", label: "Purpose", type: "textarea", placeholder: "What this project keeps together." },
      { name: "repo", label: "Repository", type: "text", placeholder: "northstar/atlas" },
    ],
    submit: "Open project",
    onSubmit: ({ name, purpose, repo }) => {
      if (!name.trim()) {
        toast({ title: "Name required", body: "A project needs a name.", tone: "red" });
        return false;
      }
      const item = createProject({ name, purpose, repo });
      prototypeToast(`${item.name} opened`);
      navigate(`/project/${item.id}`);
      return true;
    },
  });
}

export function addParticipantFlow() {
  openModal({
    title: "Add a participant",
    sub: "A participant can author contributions. A person can accept; an agent cannot.",
    fields: [
      { name: "name", label: "Name", type: "text", placeholder: "Echo" },
      { name: "kind", label: "Kind", type: "select", options: ["agent", "human"], value: "agent" },
      { name: "role", label: "Role", type: "text", placeholder: "Researcher" },
      { name: "harness", label: "Harness", type: "select", options: ["DSH", "Local shell"], value: "DSH" },
    ],
    submit: "Add participant",
    onSubmit: ({ name, kind, role, harness }) => {
      if (!name.trim()) {
        toast({ title: "Name required", body: "A participant needs a name.", tone: "red" });
        return false;
      }
      const item = addParticipant({ name, kind, role, harness });
      prototypeToast(`${item.name} added`);
      navigate(`/agent/${item.id}`);
      return true;
    },
  });
}

export function delegateFlow(item) {
  openModal({
    title: "Delegate this objective",
    sub: "Delegation grants scope for this objective. Authority still ends at the action boundary.",
    fields: [
      { name: "participantId", label: "Participant", type: "select", options: ["atlas", "echo", "forge"], value: "atlas" },
    ],
    submit: "Delegate",
    onSubmit: ({ participantId }) => {
      delegate(item.id, participantId);
      prototypeToast(`${item.id} delegated`);
      return true;
    },
  });
}

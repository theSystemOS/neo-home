import {
  CONTRIBUTION,
  objectives,
  objective,
  evidenceFor,
  person,
  project,
  relative,
  runsForObjective,
  STATUS,
} from "../data.js";
import { avatar, avatarFor, code, emptyState, esc, fact, icon, inline, pageHead, panel, statusChip, tabs } from "../ui.js";

const KIND_TONE = { proposal: "gold", observation: "cyan", evidence: "green", decision: "gold", rejection: "red", commitment: "violet" };

function nextStep(item) {
  switch (item.status) {
    case "open":
      return { title: "No owner", body: "Claim the objective or delegate it. A claim records responsibility, not completion." };
    case "claimed": {
      const live = runsForObjective(item.id).some((run) => run.status === "running");
      if (live) return { title: "Operation running", body: "The operation has not ended. Evidence attaches after the run reports its outcome, not while it is still executing." };
      return { title: "Awaiting evidence", body: `${person(item.ownerId)?.name || "The owner"} cannot verify their own work. Review the run, then attach evidence from a different participant.` };
    }
    case "verified":
      return { title: "Awaiting a person", body: "Evidence supports the outcome. Acceptance is a separate decision, and only a person can make it." };
    case "accepted":
      return { title: "Settled", body: "The evidence and the decision are both recorded. To revisit the direction, open a new objective and reference this one." };
    case "blocked":
      return { title: "Blocked", body: item.blockedReason || "No reason recorded." };
    case "parked":
      return { title: "Parked alternative", body: `Reopens when: ${item.parkedCondition || "no condition recorded"}.` };
    case "rejected":
      return { title: "Rejected", body: item.rejectionReason || "No reason recorded." };
    default:
      return { title: "Open", body: "" };
  }
}

function conditionsPanel(item) {
  return panel({
    title: "Done when",
    iconName: "check",
    action: `<span class="section-action">${item.conditions.length} conditions</span>`,
    body: item.conditions.length
      ? `<div class="conditions">${item.conditions.map((condition) => `<div class="condition">${inline(condition)}</div>`).join("")}</div>`
      : `<p class="small faint">No conditions recorded. A condition is how the outcome can be judged.</p>`,
  });
}

function evidencePanel(item, limit = null) {
  const list = item.evidence.slice(0, limit || item.evidence.length);
  return panel({
    title: "Evidence",
    iconName: "evidence",
    action: `<a class="section-action" href="#/objective/${item.id}?tab=evidence">${item.evidence.length} record${item.evidence.length === 1 ? "" : "s"} ${icon("chevronRight", 11)}</a>`,
    body: list.length
      ? `<div class="evidence-list">${list.map((record) => `<div class="evidence-card">
          <div class="evidence-refs">${record.refs.map((ref) => code(ref)).join("")}</div>
          ${record.note ? `<p class="evidence-note">${inline(record.note)}</p>` : ""}
          <div class="evidence-by">${avatarFor(record.byId, 17)} verified by ${esc(person(record.byId)?.name)} · ${esc(relative(record.t))}</div>
        </div>`).join("")}</div>`
      : `<div class="callout quiet"><div class="callout-title">${icon("alert", 12)} No evidence attached</div><div class="callout-body">A claim is not a verification. Evidence must be attached by a participant other than the owner.</div></div>`,
  });
}

function contributionMarkup(contribution) {
  const meta = CONTRIBUTION[contribution.kind] || { label: contribution.kind, icon: "message" };
  return `<div class="contribution">
    <div class="contribution-kind tone-${KIND_TONE[contribution.kind] || "slate"}">${icon(meta.icon, 12)}${esc(meta.label)}</div>
    <div class="contribution-body">
      <p>${inline(contribution.body)}</p>
      ${contribution.refs.length ? `<div class="contribution-refs">${contribution.refs.map((ref) => code(ref)).join("")}</div>` : ""}
      <div class="contribution-by">${avatarFor(contribution.authorId, 17)} ${esc(person(contribution.authorId)?.name || contribution.authorId)}</div>
    </div>
    <div class="contribution-time">${esc(relative(contribution.t))}</div>
  </div>`;
}

function contributionsPanel(item, limit = null) {
  const list = [...item.contributions].reverse().slice(0, limit || item.contributions.length);
  return panel({
    title: "Contributions",
    iconName: "message",
    action: `<a class="section-action" href="#/objective/${item.id}?tab=contributions">${item.contributions.length} total ${icon("chevronRight", 11)}</a>`,
    body: list.length ? list.map(contributionMarkup).join("") : `<p class="small faint">No contributions recorded yet.</p>`,
  });
}

function runsPanel(item) {
  const list = runsForObjective(item.id);
  return panel({
    title: "Execution",
    iconName: "runs",
    action: `<a class="section-action" href="#/runs">All runs ${icon("chevronRight", 11)}</a>`,
    body: list.length
      ? list
          .map(
            (run) => `<a class="row row--between" href="#/run/${run.id}" style="padding:9px 0;border-top:1px solid var(--line)">
              <span class="row" style="gap:9px">${avatarFor(run.participantId, 24)}<span><b style="display:block;font:500 12px var(--font-ui);color:var(--text)">${esc(run.id)}</b><span class="faint" style="font:500 9px var(--font-mono)">${esc(person(run.participantId)?.name)} · ${esc(run.events.length)} events</span></span></span>
              <span class="row" style="gap:9px">${statusChip(run.status)}${icon("chevronRight", 12)}</span>
            </a>`,
          )
          .join("")
      : emptyState({ iconName: "runs", title: "No run", body: "Execution is not connected in this prototype, so no operation reached an executor.", action: `<a class="btn btn-secondary btn-sm" href="#/connections">Review connections</a>` }),
  });
}

function overviewTab(item) {
  const step = nextStep(item);
  return `<div class="objective-grid">
    <div class="stack">
      ${conditionsPanel(item)}
      ${contributionsPanel(item, 4)}
      ${evidencePanel(item)}
    </div>
    <div class="stack">
      ${["open", "claimed"].includes(item.status) ? `<div class="next-step">${icon("arrowRight", 15)}<p><b>Next: ${esc(step.title)}.</b> ${esc(step.body)}</p></div>` : ""}
      ${item.status === "verified" ? `<div class="decision-banner tone-green">${icon("shield", 15)}<div><b>Verified · not accepted</b><p>Evidence supports the outcome. A person with authority still has to accept it.</p></div></div>` : ""}
      ${item.status === "accepted" ? `<div class="decision-banner tone-gold">${icon("check", 15)}<div><b>Accepted by ${esc(person(item.decision?.byId)?.name || "a person")}</b><p>${esc(item.decision?.note || "The decision is recorded.")}</p></div></div>` : ""}
      ${item.status === "blocked" ? `<div class="decision-banner tone-red">${icon("alert", 15)}<div><b>Blocked</b><p>${esc(item.blockedReason || "No reason recorded.")}</p></div></div>` : ""}
      ${item.status === "parked" ? `<div class="decision-banner tone-violet">${icon("pause", 15)}<div><b>Parked alternative</b><p>Reopens when: ${esc(item.parkedCondition || "no condition recorded")}.</p></div></div>` : ""}
      ${item.status === "rejected" ? `<div class="decision-banner tone-rose">${icon("close", 15)}<div><b>Rejected</b><p>${esc(item.rejectionReason || "No reason recorded.")}</p></div></div>` : ""}
      ${runsPanel(item)}
      ${panel({
        title: "Authority",
        iconName: "lock",
        body: `<dl class="facts">
          ${fact("Granted by", esc(item.authority))}
          ${fact("Owner", esc(item.ownerId ? person(item.ownerId)?.name : "unowned"))}
          ${fact("Created", esc(relative(item.createdAt)))}
          ${fact("Updated", esc(relative(item.updatedAt)))}
        </dl>
        <div class="divider"></div>
        <p class="small faint" style="line-height:1.5">A role or preset shapes behavior. It cannot grant access; the applicable grant is checked at the action boundary.</p>`,
        className: "panel--quiet",
      })}
    </div>
  </div>`;
}

export function objectiveScreen({ id, tab = "overview" }) {
  const item = objective(id);
  if (!item) {
    return {
      title: "Objective not found",
      main: `<div class="screen">${emptyState({ iconName: "decisions", title: "Objective not found", body: "This route does not identify an objective in the prototype.", action: `<a class="btn btn-secondary" href="#/home">Back to home</a>` })}</div>`,
      inspector: "",
    };
  }
  const parent = project(item.projectId);
  const step = nextStep(item);
  const list = runsForObjective(item.id);
  const evidence = evidenceFor(item.id);
  const isOwner = item.ownerId === "mira";

  let content = "";
  if (tab === "contributions") {
    content = panel({
      title: "Contributions",
      iconName: "message",
      action: `<span class="section-action">${item.contributions.length} total</span>`,
      body: item.contributions.length ? [...item.contributions].reverse().map(contributionMarkup).join("") : `<p class="small faint">No contributions recorded yet.</p>`,
      flush: true,
    });
  } else if (tab === "runs") {
    content = runsPanel(item);
  } else if (tab === "evidence") {
    content = evidencePanel(item);
  } else {
    content = overviewTab(item);
  }

  const head = pageHead({
    crumbs: [{ label: "Projects", href: "/projects" }, { label: parent?.name || "Project", href: `/project/${item.projectId}` }, { label: item.id }],
    back: { href: `/project/${item.projectId}`, label: parent?.name || "Project" },
    title: item.title,
    subtitle: esc(item.intent),
    actions: `<span class="row" style="gap:8px">${statusChip(item.status)}<span class="mono faint" style="font-size:10px">${esc(item.id)}</span></span>`,
  });

  const meta = `<div class="objective-meta">
    <span>${icon("lock", 12)} authority <b>${esc(item.authority)}</b></span>
    <span>${icon("user", 12)} owner <b>${esc(item.ownerId ? person(item.ownerId)?.name : "unowned")}</b></span>
    <span>${icon("clock", 12)} updated <b>${esc(relative(item.updatedAt))}</b></span>
    <span>${icon("projects", 12)} ${esc(parent?.name || "")}</span>
  </div>`;

  const liveRun = runsForObjective(item.id).find((run) => run.status === "running") || null;
  const disabledVerify = isOwner || Boolean(liveRun);
  const verifyReason = liveRun ? "The operation is still running" : isOwner ? "An owner cannot verify their own work" : "";
  let mobilePrimary = "";
  if (item.status === "open") mobilePrimary = `<button class="btn btn-primary" data-action="objective-claim" data-id="${item.id}">${icon("flag", 13)} Claim</button>`;
  if (item.status === "claimed" && !disabledVerify) mobilePrimary = `<button class="btn btn-primary" data-action="objective-verify" data-id="${item.id}">${icon("shield", 13)} Verify with evidence</button>`;
  if (item.status === "claimed" && disabledVerify && liveRun) mobilePrimary = `<a class="btn btn-primary" href="#/run/${liveRun.id}">${icon("runs", 13)} Inspect run</a>`;
  if (item.status === "claimed" && disabledVerify && !liveRun) mobilePrimary = `<button class="btn btn-primary" data-action="objective-contribution" data-id="${item.id}">${icon("plus", 13)} Add contribution</button>`;
  if (item.status === "verified") mobilePrimary = `<button class="btn btn-primary" data-action="objective-accept" data-id="${item.id}">${icon("check", 13)} Accept</button>`;
  if (["blocked", "parked", "rejected"].includes(item.status)) mobilePrimary = `<button class="btn btn-primary" data-action="objective-reopen" data-id="${item.id}">${icon("refresh", 13)} Reopen</button>`;

  const canCompose = ["open", "claimed", "verified"].includes(item.status);
  const composer = canCompose
    ? `<form class="composer" data-composer data-id="${item.id}">
        <div class="composer-head"><span class="tag tone-cyan">${icon("message", 12)} Contribute</span><span class="small faint">Writes one attributable contribution to this objective.</span></div>
        <div class="composer-row">
          <input name="body" placeholder="Propose, observe, or commit to something…" autocomplete="off" aria-label="Contribution" />
          <select name="kind" aria-label="Contribution kind"><option value="proposal">Proposal</option><option value="observation">Observation</option><option value="commitment">Commitment</option></select>
          <button class="btn btn-primary" type="submit">${icon("arrowRight", 13)} Add</button>
        </div>
      </form>`
    : "";

  const main = `<div class="screen">
    ${head}
    ${meta}
    ${tabs(`/objective/${item.id}`, tab, [
      { id: "overview", label: "Overview" },
      { id: "contributions", label: "Contributions", count: item.contributions.length },
      { id: "runs", label: "Runs", count: list.length },
      { id: "evidence", label: "Evidence", count: evidence.length },
    ])}
    ${composer}
    ${content}
    <div class="mobile-actionbar">${mobilePrimary}<button class="btn btn-secondary" data-action="toggle-inspector">${icon("panel", 13)} More</button></div>
  </div>`;

  const participants = [...new Set([item.ownerId, ...item.evidence.map((record) => record.byId), ...list.map((run) => run.participantId)].filter(Boolean))];
  const actions = [];
  if (item.status === "open") actions.push(`<button class="btn btn-primary" data-action="objective-claim" data-id="${item.id}">${icon("flag", 13)} Claim</button>`);
  if (item.status === "claimed") actions.push(`<button class="btn btn-primary" data-action="objective-verify" data-id="${item.id}"${disabledVerify ? ` disabled title="${verifyReason}"` : ""}>${icon("shield", 13)} Verify with evidence</button>`);
  if (item.status === "verified") actions.push(`<button class="btn btn-primary" data-action="objective-accept" data-id="${item.id}">${icon("check", 13)} Accept</button>`);
  if (["open", "claimed", "verified"].includes(item.status)) actions.push(`<button class="btn btn-secondary" data-action="objective-contribution" data-id="${item.id}">${icon("plus", 13)} Add contribution</button>`);
  if (["open", "claimed"].includes(item.status)) actions.push(`<button class="btn btn-ghost" data-action="objective-delegate" data-id="${item.id}">${icon("users", 13)} Delegate</button>`);
  if (["open", "claimed"].includes(item.status)) actions.push(`<button class="btn btn-ghost" data-action="objective-revise" data-id="${item.id}">${icon("file", 13)} Revise intent</button>`);
  if (["open", "claimed", "verified"].includes(item.status)) {
    actions.push(`<button class="btn btn-ghost" data-action="objective-park" data-id="${item.id}">${icon("pause", 13)} Park</button>`);
    actions.push(`<button class="btn btn-ghost" data-action="objective-block" data-id="${item.id}">${icon("alert", 13)} Block</button>`);
    actions.push(`<button class="btn btn-ghost" data-action="objective-reject" data-id="${item.id}">${icon("close", 13)} Reject</button>`);
  }
  if (["blocked", "parked", "rejected"].includes(item.status)) actions.push(`<button class="btn btn-primary" data-action="objective-reopen" data-id="${item.id}">${icon("refresh", 13)} Reopen</button>`);

  const inspector = `
    <div class="inspector-head"><span class="label">Objective</span>${statusChip(item.status)}</div>
    ${panel({
      title: "Actions",
      iconName: "flag",
      body: `<div class="stack-sm">${actions.join("") || `<p class="small faint">This objective is settled. No further action is available.</p>`}</div>
        ${disabledVerify && item.status === "claimed" ? `<p class="small faint" style="margin-top:9px;line-height:1.5">${liveRun ? "The operation is still running. Wait for it to end before attaching evidence." : "You own this objective. Another participant must verify it."}</p>` : ""}`,
    })}
    ${panel({
      title: "Participants",
      iconName: "agents",
      body: participants.length
        ? `<div class="stack-sm">${participants.map((participant) => `<a class="row row--between" href="#/agent/${participant}" style="padding:6px 0;border-top:1px solid var(--line)"><span class="row" style="gap:8px">${avatarFor(participant, 24)}<span style="font-size:12px">${esc(person(participant)?.name)}</span></span></a>`).join("")}</div>`
        : `<p class="small faint">No participant attached yet.</p>`,
    })}
    ${panel({
      title: "How this moves",
      iconName: "book",
      body: `<div class="legend" style="gap:8px">
        <div style="display:grid;grid-template-columns:70px 1fr;gap:8px"><b class="mono faint" style="font-size:9px">CLAIMED</b><span class="small faint">someone owns it</span></div>
        <div style="display:grid;grid-template-columns:70px 1fr;gap:8px"><b class="mono faint" style="font-size:9px">RUNNING</b><span class="small faint">an executor reports it</span></div>
        <div style="display:grid;grid-template-columns:70px 1fr;gap:8px"><b class="mono faint" style="font-size:9px">VERIFIED</b><span class="small faint">evidence supports it</span></div>
        <div style="display:grid;grid-template-columns:70px 1fr;gap:8px"><b class="mono faint" style="font-size:9px">ACCEPTED</b><span class="small faint">a person decided</span></div>
      </div>`,
      className: "panel--quiet",
    })}`;

  return { title: `${item.id} · ${item.title} · neo-home`, main, inspector };
}

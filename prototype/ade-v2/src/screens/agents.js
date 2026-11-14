import { currentRunFor, evidence, objectives, people, person, relative, runs } from "../data.js";
import { avatar, avatarFor, esc, icon, pageHead, panel, statusChip } from "../ui.js";

function agentCard(participant) {
  const live = currentRunFor(participant.id);
  return `<a class="agent-card" href="#/agent/${participant.id}">
    <div class="agent-card-top">
      ${avatar(participant, 34)}
      <div class="agent-card-id"><b>${esc(participant.name)}</b><span>${esc(participant.role)} · ${esc(participant.harness || "human")}</span></div>
      ${live ? statusChip("running") : `<span class="status status--plain"><i class="dot"></i>${esc(participant.status)}</span>`}
    </div>
    <div class="capabilities">${(participant.capabilities || []).map((capability) => `<span class="tag">${esc(capability)}</span>`).join("")}</div>
    ${live ? `<div class="agent-card-current">${icon("runs", 12)}${esc(live.id)} · ${esc(live.summary)}<span>live</span></div>` : ""}
    <div class="agent-card-stats"><span><b>${participant.contributions}</b> contributions</span><span><b>${participant.verified || 0}</b> verified</span><span><b>${runs.filter((run) => run.participantId === participant.id).length}</b> runs</span></div>
  </a>`;
}

export function agentsScreen() {
  const humans = people.filter((participant) => participant.kind === "human");
  const agents = people.filter((participant) => participant.kind === "agent");

  const main = `<div class="screen">
    ${pageHead({
      eyebrow: { icon: "agents", label: "Participants" },
      title: "Who is doing the work.",
      subtitle: "People and agents are participants, not personas. A role describes judgment and initiative; a capability describes reach; neither grants authority by itself.",
      actions: `<button class="btn btn-secondary" data-action="add-participant">${icon("plus", 14)} Add participant</button>`,
    })}
    <div class="section-head"><div class="section-title">Agents <span class="count">${agents.length}</span></div><span class="section-action">${agents.filter((participant) => participant.status === "running").length} working</span></div>
    <div class="agent-grid">${agents.map(agentCard).join("")}</div>
    <div class="section-head" style="margin-top:26px"><div class="section-title">People <span class="count">${humans.length}</span></div><span class="section-action">authority lives here</span></div>
    <div class="panel panel--flush">${humans
      .map(
        (participant) => `<a class="row-item row-item--link" href="#/agent/${participant.id}" style="grid-template-columns:34px minmax(0,1fr) auto">
          ${avatar(participant, 28)}
          <div class="row-primary"><b>${esc(participant.name)}</b><span>${esc(participant.role)} · joined ${esc(relative(participant.since))}</span></div>
          <div class="row-meta"><span>${participant.contributions} contributions</span><span class="small faint">online</span>${icon("chevronRight", 13)}</div>
        </a>`,
      )
      .join("")}</div>
  </div>`;

  const inspector = `
    <div class="inspector-head"><span class="label">Participants</span><span class="status status--plain"><i class="dot"></i>${people.length} total</span></div>
    ${panel({
      title: "Roles are behavior",
      iconName: "users",
      body: `<p class="small muted" style="line-height:1.6">A role sets responsibilities, judgment and initiative. A preset packages a role with a model and tools. Neither can grant itself access or the right to decide.</p>
      <div class="divider"></div>
      <dl class="facts">
        <div class="fact"><dt>Agents</dt><dd>${agents.length}</dd></div>
        <div class="fact"><dt>People</dt><dd>${humans.length}</dd></div>
        <div class="fact"><dt>Working</dt><dd>${agents.filter((participant) => participant.status === "running").length}</dd></div>
        <div class="fact"><dt>Verified work</dt><dd>${agents.reduce((sum, participant) => sum + (participant.verified || 0), 0)}</dd></div>
      </dl>`,
    })}
    ${panel({
      title: "Authority",
      iconName: "lock",
      body: `<p class="small faint" style="line-height:1.55">Grants are attached to an objective, checked at the action boundary. A model change never widens what an agent may do.</p>`,
      className: "panel--quiet",
    })}`;

  return { title: "Participants · neo-home", main, inspector };
}

export function agentScreen({ id }) {
  const participant = person(id);
  if (!participant) {
    return {
      title: "Participant not found",
      main: `<div class="screen"><div class="empty"><div class="empty-icon">${icon("agents", 18)}</div><h3>Participant not found</h3><p>This route does not identify a participant in the prototype.</p><a class="btn btn-secondary" href="#/agents">Back to participants</a></div></div>`,
      inspector: "",
    };
  }
  const participantRuns = runs.filter((run) => run.participantId === participant.id);
  const live = participantRuns.find((run) => run.status === "running");
  const authored = objectives.filter((item) => item.contributions.some((contribution) => contribution.authorId === participant.id));
  const verifiedEvidence = evidence.filter((record) => record.byId === participant.id);
  const human = participant.kind === "human";

  const main = `<div class="screen">
    ${pageHead({
      crumbs: [{ label: "Participants", href: "/agents" }, { label: participant.name }],
      back: { href: "/agents", label: "Participants" },
      eyebrow: { icon: human ? "user" : "cpu", label: human ? "Person · authority" : `Agent · ${participant.harness || "harness"}` },
      title: participant.name,
      subtitle: human ? `${participant.role}. A person can accept; an agent cannot.` : `${participant.role}. Role and capabilities shape behavior; grants decide reach.`,
      actions: `<div class="row" style="gap:8px">${live ? statusChip("running") : `<span class="status status--plain"><i class="dot"></i>${participant.status}</span>`}${!human ? `<a class="btn btn-secondary" href="#/runs">${icon("runs", 13)} All runs</a>` : ""}</div>`,
    })}
    <div class="objective-grid">
      <div class="stack">
        ${panel({
          title: "Profile",
          iconName: human ? "user" : "cpu",
          body: `<div class="agent-identity" style="align-items:center">${avatar(participant, 42)}<div><b style="font:600 14px var(--font-ui)">${esc(participant.role)}</b><p style="margin-top:4px;font:500 9.5px var(--font-mono);color:var(--faint)">${human ? "human participant" : `${esc(participant.harness)} · ${esc(participant.model || "default model")}`} · joined ${esc(relative(participant.since))}</p></div></div>
          <div class="divider"></div>
          <div class="agent-stats">
            <div class="agent-stat"><span>Contributions</span><b>${participant.contributions}</b></div>
            <div class="agent-stat"><span>Verified work</span><b>${participant.verified || 0}</b></div>
            <div class="agent-stat"><span>Runs</span><b>${participantRuns.length}</b></div>
          </div>`,
        })}
        ${!human ? panel({ title: "Capabilities", iconName: "sliders", body: `<div class="capabilities">${(participant.capabilities || []).map((capability) => `<span class="tag">${esc(capability)}</span>`).join("")}</div><div class="divider"></div><p class="small faint" style="line-height:1.55">A capability is available reach, not permission. The grant on the objective decides whether it may be used now.</p>` }) : ""}
        ${live ? panel({ title: "Current run", iconName: "runs", body: `<a class="row row--between" href="#/run/${live.id}" style="padding:2px 0"><span><b style="display:block;font:500 12px var(--font-ui)">${esc(live.summary)}</b><span class="small faint">${esc(live.id)} · started ${esc(relative(live.startedAt))} · ${esc(live.events.length)} events</span></span>${statusChip("running")}</a>` }) : ""}
        ${panel({
          title: "Contributions",
          iconName: "message",
          action: `<span class="section-action">${authored.length} objectives</span>`,
          body: authored.length
            ? authored.map((item) => `<a class="row row--between" href="#/objective/${item.id}" style="padding:8px 0;border-top:1px solid var(--line)"><span><b style="display:block;font:500 12px var(--font-ui)">${esc(item.title)}</b><span class="small faint">${esc(item.id)} · ${esc(item.status)}</span></span>${statusChip(item.status)}</a>`).join("")
            : `<p class="small faint">No contributions authored yet.</p>`,
        })}
        ${panel({
          title: "Runs",
          iconName: "runs",
          body: participantRuns.length
            ? participantRuns.map((run) => `<a class="row row--between" href="#/run/${run.id}" style="padding:8px 0;border-top:1px solid var(--line)"><span class="mono faint" style="font-size:10px">${esc(run.id)}</span><span class="small">${esc(run.summary)}</span>${statusChip(run.status)}</a>`).join("")
            : `<p class="small faint">No runs recorded.</p>`,
        })}
      </div>
      <div class="stack">
        ${panel({
          title: "Authority",
          iconName: "lock",
          body: `<dl class="facts">
            ${`<div class="fact"><dt>Kind</dt><dd>${esc(participant.kind)}</dd></div>`}
            ${`<div class="fact"><dt>Role</dt><dd>${esc(participant.role)}</dd></div>`}
            ${`<div class="fact"><dt>Grant</dt><dd>per objective</dd></div>`}
            ${`<div class="fact"><dt>Accept</dt><dd>${human ? "allowed" : "not allowed"}</dd></div>`}
          </dl>
          <div class="divider"></div>
          <p class="small faint" style="line-height:1.55">A person can accept verified work. An agent can contribute, run and attach evidence; it cannot accept its own work.</p>`,
          className: "panel--quiet",
        })}
        ${panel({
          title: "Verified evidence",
          iconName: "shield",
          body: verifiedEvidence.length
            ? `<div class="stack-sm">${verifiedEvidence.map((record) => `<a class="row row--between" href="#/objective/${record.objectiveId}?tab=evidence" style="padding:7px 0;border-top:1px solid var(--line)"><span class="mono faint" style="font-size:9px">${esc(record.id)}</span><span class="small">${esc(record.note)}</span></a>`).join("")}</div>`
            : `<p class="small faint">No evidence verified by this participant.</p>`,
        })}
      </div>
    </div>
  </div>`;

  const inspector = `
    <div class="inspector-head"><span class="label">Participant</span><span class="status status--plain"><i class="dot"></i>${human ? "person" : "agent"}</span></div>
    ${panel({
      title: "At a glance",
      iconName: "user",
      body: `<dl class="facts">
        ${`<div class="fact"><dt>Name</dt><dd>${esc(participant.name)}</dd></div>`}
        ${`<div class="fact"><dt>Role</dt><dd>${esc(participant.role)}</dd></div>`}
        ${`<div class="fact"><dt>Since</dt><dd>${esc(relative(participant.since))}</dd></div>`}
        ${`<div class="fact"><dt>Status</dt><dd>${esc(participant.status)}</dd></div>`}
      </dl>
      ${live ? `<div class="divider"></div><a class="btn btn-secondary btn-sm" href="#/run/${live.id}" style="width:100%">${icon("runs", 13)} Inspect current run</a>` : ""}`,
    })}
    ${panel({
      title: "Not a persona",
      iconName: "book",
      body: `<p class="small faint" style="line-height:1.55">Swapping a role or model never silently widens what a participant may do. Permission is checked at the action boundary against the applicable record.</p>`,
      className: "panel--quiet",
    })}`;

  return { title: `${participant.name} · neo-home`, main, inspector };
}

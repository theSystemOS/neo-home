import {
  activeRuns,
  activity,
  elapsed,
  needsYou,
  objectives,
  people,
  person,
  project,
  projectCounts,
  projects,
  proposals,
  relative,
  runs,
  workspace,
  STATUS,
} from "../data.js";
import {
  avatar,
  avatarFor,
  code,
  emptyState,
  esc,
  fact,
  icon,
  miniBar,
  pageHead,
  panel,
  projectLink,
  statusChip,
  statusCounts,
  timeAgo,
  toneFor,
} from "../ui.js";

function needRows() {
  const rows = [];
  for (const item of objectives.filter((candidate) => candidate.status === "verified")) {
    const evidence = item.evidence[0];
    rows.push({
      tone: "green",
      icon: "shield",
      title: item.title,
      context: `${project(item.projectId)?.name} · verified ${evidence ? relative(evidence.t) : "recently"} by ${person(evidence?.byId)?.name || "a reviewer"} — awaiting your acceptance`,
      action: "Review",
      href: `#/objective/${item.id}`,
    });
  }
  for (const proposal of proposals().filter((entry) => ["open", "claimed"].includes(entry.objective.status) && entry.objective.priority === "urgent").slice(0, 1)) {
    rows.push({
      tone: "gold",
      icon: "decisions",
      title: `Decide: ${proposal.objective.title}`,
      context: `${project(proposal.objective.projectId)?.name} · proposal by ${person(proposal.authorId)?.name}: ${proposal.body}`,
      action: "Decide",
      href: `#/objective/${proposal.objective.id}?tab=contributions`,
    });
  }
  for (const item of objectives.filter((candidate) => candidate.status === "blocked")) {
    rows.push({
      tone: "red",
      icon: "alert",
      title: item.title,
      context: `${project(item.projectId)?.name} · ${item.blockedReason}`,
      action: "Review",
      href: `#/objective/${item.id}`,
    });
  }
  return rows.slice(0, 3);
}

function needRow(row) {
  return `<div class="need-row">
    <span class="need-mark tone-${row.tone}">${icon(row.icon, 13)}</span>
    <div class="need-main"><b>${esc(row.title)}</b><span>${esc(row.context)}</span></div>
    <a class="btn btn-secondary btn-sm" href="${row.href}">${esc(row.action)} ${icon("chevronRight", 12)}</a>
  </div>`;
}

function projectMini(item) {
  const counts = projectCounts(item.id);
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return `<a class="project-mini" href="#/project/${item.id}">
    <div class="project-mini-main"><b>${esc(item.name)}</b><span>${esc(item.purpose)}</span></div>
    <div class="project-mini-meta"><span>${total} objectives</span><br><span>${relative(item.updatedAt)}</span></div>
  </a>`;
}

function activityMini(entry) {
  return `<div class="activity-mini">
    <time>${esc(relative(entry.t))}</time>
    <p><b>${esc(person(entry.actorId)?.name || entry.actorId)}</b> ${esc(entry.text)} <a href="#/${entry.route}">${esc(entry.target)}</a></p>
  </div>`;
}

export function home() {
  const live = activeRuns();
  const needs = needRows();
  const totalObjectives = objectives.length;
  function openDecisions() {
    return objectives.filter((item) => item.status === "verified").length + proposals().filter((entry) => ["open", "claimed"].includes(entry.objective.status)).length + objectives.filter((item) => item.status === "blocked").length;
  }

  const main = `<div class="screen">
    ${pageHead({
      eyebrow: { icon: "home", label: `Workspace · ${workspace.name}` },
      title: "Welcome back, Mira.",
      subtitle: `Three projects, ${people.length} participants, one run in flight, ${openDecisions()} open decisions. The ledger is intact; nothing needs reconstruction.`,
      actions: `<button class="btn btn-secondary" data-action="palette">${icon("search", 14)} Jump to…</button><a class="btn btn-quiet" href="#/decisions">${icon("decisions", 14)} Review decisions</a>`,
    })}
    <div class="home-layout">
      <div class="stack">
        ${panel({
          title: "Needs you",
          iconName: "flag",
          action: `<a class="section-action" href="#/decisions">Open decisions ${icon("chevronRight", 11)}</a>`,
          body: needs.length ? needs.map(needRow).join("") : emptyState({ iconName: "check", title: "Nothing needs you", body: "No verified work waits for acceptance; no path is blocked." }),
          flush: true,
        })}
        <section class="panel panel--flush">
          <div class="panel-head"><div class="panel-title">${icon("runs", 14)} In flight <span class="count">${live.length}</span></div><a class="section-action" href="#/runs">All runs ${icon("chevronRight", 11)}</a></div>
          ${
            live.length
              ? live
                  .map((run) => {
                    const item = objectives.find((candidate) => candidate.id === run.objectiveId);
                    const latest = run.events[run.events.length - 1];
                    return `<div class="inflight">
                      <div class="inflight-top">
                        <a href="#/agent/${run.participantId}">${avatarFor(run.participantId, 30)}</a>
                        <div class="inflight-body">
                          <b><a href="#/run/${run.id}">${esc(run.summary)}</a></b>
                          <span>${esc(person(run.participantId)?.name)} · ${esc(run.harness)} · ${esc(item?.id)} · grant ${esc(run.grant.split("·")[1]?.trim() || run.grant)}</span>
                        </div>
                        ${statusChip("running")}
                      </div>
                      <div class="inflight-live"><i class="pulse"></i><span>${esc(latest?.title || "Working")}</span><span class="spacer"></span><span>${esc(elapsed(run.startedAt))} elapsed</span><a class="link" href="#/run/${run.id}">Inspect ${icon("arrowRight", 11)}</a></div>
                    </div>`;
                  })
                  .join("")
              : emptyState({ iconName: "runs", title: "No run in flight", body: "Execution is unavailable until a harness adapter is connected." })
          }
          <div class="connection-note">${icon("alert", 13)} Execution adapter not connected. The run above is illustrative; the connected build will report a real lifecycle.</div>
        </section>
      </div>
      <div class="stack">
        ${panel({
          title: "Projects",
          iconName: "projects",
          action: `<a class="section-action" href="#/projects">All projects ${icon("chevronRight", 11)}</a>`,
          body: projects.map(projectMini).join(""),
          flush: true,
        })}
        ${panel({
          title: "Recent activity",
          iconName: "activity",
          action: `<span class="section-action">${totalObjectives} objectives</span>`,
          body: activity.slice(0, 6).map(activityMini).join(""),
          flush: true,
        })}
      </div>
    </div>
  </div>`;

  const inspector = `
    <div class="inspector-head"><span class="label">Context</span><span class="status status--plain"><i class="dot"></i>Northstar</span></div>
    ${panel({
      title: "Workspace",
      iconName: "grid",
      body: `<dl class="facts">
        ${fact("Ledger", `<span class="row" style="gap:6px"><i class="dot-live"></i>intact · ${workspace.ledgerEvents} events</span>`)}
        ${fact("Head", code(workspace.head))}
        ${fact("Environment", esc(workspace.environment))}
        ${fact("Adapter", `<span class="row" style="gap:6px;color:var(--gold)"><i class="dot-live warn"></i>not connected</span>`)}
      </dl>`,
    })}
    ${panel({
      title: "Participants",
      iconName: "agents",
      action: `<a class="section-action" href="#/agents">All</a>`,
      body: `<div class="stack-sm">${people
        .map((participant) => {
          const run = participant.currentRunId ? runs.find((candidate) => candidate.id === participant.currentRunId) : null;
          return `<a class="row row--between" href="#/agent/${participant.id}" style="padding:7px 0;border-top:1px solid var(--line)">
            <span class="row" style="gap:8px">${avatar(participant, 26)}<span><b style="display:block;font-weight:500;font-size:12px">${esc(participant.name)}</b><span class="faint" style="font:500 9px var(--font-mono)">${esc(participant.role)}</span></span></span>
            ${run ? statusChip("running", { label: "in run" }) : `<span class="presence ${participant.status === "idle" ? "idle" : ""}"></span>`}
          </a>`;
        })
        .join("")}</div>`,
    })}
    ${panel({
      title: "What this is",
      iconName: "book",
      body: `<p class="small muted" style="line-height:1.55">A surface over intent, authority and evidence. Every run, claim and decision is attributable; execution is the next layer, not this one.</p><div class="divider"></div><a class="btn btn-secondary btn-sm" href="#/connections" style="width:100%">${icon("connections", 13)} Review connections</a>`,
      className: "panel--quiet",
    })}`;

  return { title: "Home · neo-home", main, inspector };
}

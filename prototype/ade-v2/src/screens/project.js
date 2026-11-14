import {
  activity,
  elapsed,
  person,
  project,
  projectCounts,
  proposals,
  relative,
  run,
  runsForProject,
  objectivesForProject,
} from "../data.js";
import { avatarFor, code, emptyState, esc, fact, icon, miniBar, pageHead, panel, statusChip, tabs } from "../ui.js";

const COLUMNS = [
  { id: "open", label: "Open", tone: "slate", test: (item) => item.status === "open" },
  { id: "claimed", label: "Claimed", tone: "cyan", test: (item) => item.status === "claimed" },
  { id: "verified", label: "Verified", tone: "green", test: (item) => item.status === "verified" },
  { id: "accepted", label: "Accepted", tone: "gold", test: (item) => item.status === "accepted" },
  { id: "attention", label: "Attention", tone: "red", test: (item) => ["blocked", "parked", "rejected"].includes(item.status) },
];

function boardCard(item) {
  const evidence = item.evidence.length;
  const runCount = item.runIds.length;
  return `<a class="board-card" href="#/objective/${item.id}">
    <div class="bc-meta"><span class="bc-id">${esc(item.id)}</span>${item.priority === "urgent" ? `<span class="tag tone-red">urgent</span>` : item.priority === "high" ? `<span class="tag">high</span>` : ""}</div>
    <b>${esc(item.title)}</b>
    <div class="bc-foot">${item.ownerId ? avatarFor(item.ownerId, 17) : `<span class="faint">unowned</span>`}${evidence ? `<span class="row" style="gap:3px">${icon("shield", 11)} ${evidence}</span>` : ""}${runCount ? `<span class="row" style="gap:3px">${icon("runs", 11)} ${runCount}</span>` : ""}</div>
    ${["blocked", "parked", "rejected"].includes(item.status) ? `<div class="bc-meta">${statusChip(item.status)}</div>` : ""}
  </a>`;
}

function board(list, projectId) {
  return `<div class="board">${COLUMNS.map((column) => {
    const items = list.filter(column.test);
    return `<section class="board-col">
      <div class="board-col-head"><span class="status tone-${column.tone}"><i class="dot"></i>${esc(column.label)}</span><span class="count">${items.length}</span></div>
      <div class="board-cards">${items.length ? items.map(boardCard).join("") : `<div class="board-empty">Nothing here.</div>`}</div>
      ${column.id === "open" ? `<button class="board-add" data-action="new-objective" data-project="${esc(projectId || list[0]?.projectId || "")}">${icon("plus", 11)} Objective</button>` : ""}
    </section>`;
  }).join("")}</div>`;
}

function decisionRows(list) {
  const rows = [];
  for (const item of list.filter((candidate) => candidate.status === "verified")) {
    rows.push({ tone: "green", icon: "shield", title: item.title, context: `${item.id} · verified evidence · awaiting acceptance`, action: "Review", href: `#/objective/${item.id}` });
  }
  for (const proposal of proposals().filter((entry) => entry.objective.projectId === list[0]?.projectId && ["open", "claimed"].includes(entry.objective.status))) {
    rows.push({ tone: "gold", icon: "decisions", title: proposal.objective.title, context: `${proposal.objective.id} · proposal by ${person(proposal.authorId)?.name || proposal.authorId}`, action: "Decide", href: `#/objective/${proposal.objective.id}?tab=contributions` });
  }
  for (const item of list.filter((candidate) => ["blocked", "parked", "rejected"].includes(candidate.status))) {
    rows.push({
      tone: item.status === "blocked" ? "red" : item.status === "parked" ? "violet" : "rose",
      icon: item.status === "blocked" ? "alert" : item.status === "parked" ? "pause" : "close",
      title: item.title,
      context: `${item.id} · ${item.status}${item.blockedReason ? ` · ${item.blockedReason}` : item.parkedCondition ? ` · reopens when ${item.parkedCondition}` : item.rejectionReason ? ` · ${item.rejectionReason}` : ""}`,
      action: "Open",
      href: `#/objective/${item.id}`,
    });
  }
  return rows;
}

export function projectScreen({ id, tab = "board" }) {
  const item = project(id);
  if (!item) {
    return {
      title: "Project not found",
      main: `<div class="screen">${emptyState({ iconName: "projects", title: "Project not found", body: "This route does not identify a project in the prototype.", action: `<a class="btn btn-secondary" href="#/projects">Back to projects</a>` })}</div>`,
      inspector: "",
    };
  }
  const list = objectivesForProject(item.id);
  const counts = projectCounts(item.id);
  const projectRuns = runsForProject(item.id);
  const decisions = decisionRows(list);
  const projectActivity = activity.filter((entry) => list.some((objective) => entry.route.endsWith(objective.id)) || entry.route.endsWith(item.id));

  const head = pageHead({
    crumbs: [{ label: "Projects", href: "/projects" }, { label: item.name }],
    back: { href: "/projects", label: "Portfolio" },
    title: item.name,
    subtitle: esc(item.purpose),
    actions: `<button class="btn btn-secondary" data-action="palette">${icon("search", 14)} Jump to…</button><a class="btn btn-quiet" href="#/connections">${icon("connections", 14)} Connections</a>`,
  });

  const meta = `<div class="project-meta">
    <span>${icon("branch", 12)} <b>${esc(item.repo)}</b> · ${esc(item.branch)}</span>
    <span>${icon("globe", 12)} ${esc(item.environment)}</span>
    <span>${icon("user", 12)} ${esc(person(item.ownerId)?.name || "unowned")}</span>
    <span>${icon("activity", 12)} ${esc(relative(item.updatedAt))}</span>
  </div>`;

  let content = "";
  if (tab === "decisions") {
    content = panel({
      title: "Decisions",
      iconName: "decisions",
      action: `<span class="section-action">${decisions.length} open</span>`,
      body: decisions.length
        ? decisions
            .map(
              (row) => `<div class="decision-row">
                <span class="need-mark tone-${row.tone}">${icon(row.icon, 13)}</span>
                <div class="decision-main"><b>${esc(row.title)}</b><span>${esc(row.context)}</span></div>
                <span class="decision-context"></span>
                <a class="btn btn-secondary btn-sm" href="${row.href}">${esc(row.action)} ${icon("chevronRight", 11)}</a>
              </div>`,
            )
            .join("")
        : emptyState({ iconName: "check", title: "No decision waits", body: "Every verified objective has been accepted and no path is blocked." }),
      flush: true,
    });
  } else if (tab === "activity") {
    content = panel({
      title: "Activity",
      iconName: "activity",
      body: projectActivity.length
        ? projectActivity.map((entry) => `<div class="project-activity"><time>${esc(relative(entry.t))}</time><p><b>${esc(person(entry.actorId)?.name || entry.actorId)}</b> ${esc(entry.text)} <a href="#/${entry.route}">${esc(entry.target)}</a></p><span class="tag">${esc(entry.kind)}</span></div>`).join("")
        : emptyState({ iconName: "activity", title: "No activity", body: "Contributions and runs will appear here." }),
      flush: true,
    });
  } else {
    content = `<div class="section-head"><div class="section-title">Board <span class="count">${list.length} objectives</span></div><div class="counts">${["open", "claimed", "verified", "accepted"].map((status) => `<span class="count tone-${status === "open" ? "slate" : status === "claimed" ? "cyan" : status === "verified" ? "green" : "gold"}"><i></i><b>${counts[status]}</b> ${status}</span>`).join("")}</div></div>${board(list, item.id)}`;
  }

  const main = `<div class="screen">
    ${head}
    ${meta}
    ${tabs(`/project/${item.id}`, tab, [
      { id: "board", label: "Board", count: list.length },
      { id: "decisions", label: "Decisions", count: decisions.length },
      { id: "activity", label: "Activity", count: projectActivity.length },
    ])}
    ${content}
  </div>`;

  const participantIds = [...new Set([item.ownerId, ...projectRuns.map((run) => run.participantId)].filter(Boolean))];
  const inspector = `
    <div class="inspector-head"><span class="label">Project</span>${statusChip(list.some((objective) => objective.status === "blocked") ? "blocked" : "claimed", { label: list.some((objective) => objective.status === "blocked") ? "attention" : "in progress" })}</div>
    ${panel({
      title: "Facts",
      iconName: "projects",
      body: `<dl class="facts">
        ${fact("Repository", code(item.repo), { full: true })}
        ${fact("Branch", esc(item.branch))}
        ${fact("Environment", esc(item.environment))}
        ${fact("Owner", esc(person(item.ownerId)?.name || "unowned"))}
        ${fact("Updated", esc(relative(item.updatedAt)))}
      </dl>
      <div class="divider"></div>
      ${miniBar(counts, 5)}
      <div class="counts" style="margin-top:9px">${["open", "claimed", "verified", "accepted"].map((status) => `<span class="count tone-${status === "open" ? "slate" : status === "claimed" ? "cyan" : status === "verified" ? "green" : "gold"}"><i></i><b>${counts[status]}</b> ${status}</span>`).join("")}</div>`,
    })}
    ${panel({
      title: "Participants",
      iconName: "agents",
      action: `<a class="section-action" href="#/agents">All</a>`,
      body: participantIds.length
        ? `<div class="stack-sm">${participantIds.map((participantId) => `<a class="row row--between" href="#/agent/${participantId}" style="padding:6px 0;border-top:1px solid var(--line)"><span class="row" style="gap:8px">${avatarFor(participantId, 24)}<span style="font-size:12px">${esc(person(participantId)?.name)}</span></span></a>`).join("")}</div>`
        : `<p class="small faint">No participant owns work in this project yet.</p>`,
    })}
    ${panel({
      title: "Runs",
      iconName: "runs",
      action: `<a class="section-action" href="#/runs">All</a>`,
      body: projectRuns.length
        ? `<div class="stack-sm">${projectRuns.slice(0, 4).map((run) => `<a class="row row--between" href="#/run/${run.id}" style="padding:7px 0;border-top:1px solid var(--line)"><span><span class="mono faint" style="font-size:9px">${esc(run.id)}</span><br><span style="font-size:11px">${esc(person(run.participantId)?.name)} · ${esc(elapsed(run.startedAt, run.endedAt))}</span></span>${statusChip(run.status)}</a>`).join("")}</div>`
        : `<p class="small faint">No execution is recorded for this project.</p>`,
    })}`;

  return { title: `${item.name} · neo-home`, main, inspector };
}

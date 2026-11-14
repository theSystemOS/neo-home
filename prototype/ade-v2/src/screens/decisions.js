import { objectives, person, project, proposals, relative } from "../data.js";
import { emptyState, esc, icon, pageHead, panel, statusChip } from "../ui.js";

function decisionItem({ tone, iconName, title, context, meta, href, action = "Review" }) {
  return `<div class="decision-row">
    <span class="need-mark tone-${tone}">${icon(iconName, 13)}</span>
    <div class="decision-main"><b>${esc(title)}</b><span>${esc(context)}</span></div>
    <div class="decision-context">${esc(meta)}</div>
    <a class="btn btn-secondary btn-sm" href="${href}">${esc(action)} ${icon("chevronRight", 11)}</a>
  </div>`;
}

export function decisionsScreen() {
  const awaiting = objectives.filter((item) => item.status === "verified");
  const openProposals = proposals().filter((entry) => ["open", "claimed"].includes(entry.objective.status));
  const blocked = objectives.filter((item) => item.status === "blocked");
  const parked = objectives.filter((item) => item.status === "parked");
  const rejected = objectives.filter((item) => item.status === "rejected");

  const groups = [
    {
      id: "awaiting",
      title: "Awaiting your acceptance",
      tone: "green",
      count: awaiting.length,
      items: awaiting.map((item) => ({
        tone: "green",
        iconName: "shield",
        title: item.title,
        context: `${project(item.projectId)?.name} · evidence supports the outcome; a person must accept`,
        meta: `${item.id} · ${relative(item.updatedAt)}`,
        href: `#/objective/${item.id}`,
        action: "Accept",
      })),
    },
    {
      id: "proposals",
      title: "Open proposals",
      tone: "gold",
      count: openProposals.length,
      items: openProposals.map((entry) => ({
        tone: "gold",
        iconName: "decisions",
        title: entry.objective.title,
        context: `${project(entry.objective.projectId)?.name} · proposal by ${person(entry.authorId)?.name}: ${entry.body}`,
        meta: `${entry.objective.id} · ${relative(entry.t)}`,
        href: `#/objective/${entry.objective.id}?tab=contributions`,
        action: "Decide",
      })),
    },
    {
      id: "blocked",
      title: "Blocked",
      tone: "red",
      count: blocked.length,
      items: blocked.map((item) => ({
        tone: "red",
        iconName: "alert",
        title: item.title,
        context: `${project(item.projectId)?.name} · ${item.blockedReason}`,
        meta: `${item.id} · ${relative(item.updatedAt)}`,
        href: `#/objective/${item.id}`,
        action: "Unblock",
      })),
    },
    {
      id: "parked",
      title: "Parked alternatives",
      tone: "violet",
      count: parked.length,
      items: parked.map((item) => ({
        tone: "violet",
        iconName: "pause",
        title: item.title,
        context: `${project(item.projectId)?.name} · reopens when ${item.parkedCondition}`,
        meta: `${item.id} · ${relative(item.updatedAt)}`,
        href: `#/objective/${item.id}`,
        action: "Review",
      })),
    },
    {
      id: "rejected",
      title: "Rejected, with reasons",
      tone: "rose",
      count: rejected.length,
      items: rejected.map((item) => ({
        tone: "rose",
        iconName: "close",
        title: item.title,
        context: `${project(item.projectId)?.name} · ${item.rejectionReason}`,
        meta: `${item.id} · ${relative(item.updatedAt)}`,
        href: `#/objective/${item.id}`,
        action: "Review",
      })),
    },
  ];

  const main = `<div class="screen">
    ${pageHead({
      eyebrow: { icon: "decisions", label: "Decisions" },
      title: "What needs a person.",
      subtitle: `Verified work waits for acceptance. Open proposals wait for a decision. Blocked and parked paths stay visible until their condition changes. ${awaiting.length + openProposals.length + blocked.length} need you now; ${parked.length + rejected.length} are parked or rejected.`,
      actions: `<a class="btn btn-secondary" href="#/objective/LG-002">${icon("decisions", 14)} Open proposal</a>`,
    })}
    ${groups
      .filter((group) => group.count > 0)
      .map(
        (group) => `<section class="decision-group">
          <div class="section-head"><div class="section-title">${esc(group.title)} <span class="count">${group.count}</span></div><span class="status tone-${group.tone}"><i class="dot"></i>${group.count} open</span></div>
          <div class="panel panel--flush">${group.items.map(decisionItem).join("")}</div>
        </section>`,
      )
      .join("")}
    ${
      groups.every((group) => group.count === 0)
        ? emptyState({ iconName: "check", title: "Nothing needs you", body: "No verified work waits, no proposal is open, and no path is blocked.", action: `<a class="btn btn-secondary" href="#/projects">Open a project</a>` })
        : ""
    }
  </div>`;

  const inspector = `
    <div class="inspector-head"><span class="label">Decision</span><span class="status status--plain"><i class="dot"></i>${awaiting.length + openProposals.length + blocked.length} need you</span></div>
    ${panel({
      title: "The four words",
      iconName: "book",
      body: `<div style="display:grid;gap:9px">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${statusChip("claimed")}<span class="small faint">someone owns it</span></div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${statusChip("running")}<span class="small faint">an executor reports it</span></div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${statusChip("verified")}<span class="small faint">evidence supports it</span></div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${statusChip("accepted")}<span class="small faint">a person decided</span></div>
      </div>
      <div class="divider"></div>
      <p class="small faint" style="line-height:1.55">A model saying “done” is none of these. Evidence of success is not permission to act.</p>`,
    })}
    ${panel({
      title: "Where they come from",
      iconName: "filter",
      body: `<dl class="facts">
        <div class="fact"><dt>Verified</dt><dd>${awaiting.length}</dd></div>
        <div class="fact"><dt>Proposals</dt><dd>${openProposals.length}</dd></div>
        <div class="fact"><dt>Blocked</dt><dd>${blocked.length}</dd></div>
        <div class="fact"><dt>Parked</dt><dd>${parked.length}</dd></div>
        <div class="fact"><dt>Rejected</dt><dd>${rejected.length}</dd></div>
      </dl>`,
      className: "panel--quiet",
    })}`;

  return { title: "Decisions · neo-home", main, inspector };
}

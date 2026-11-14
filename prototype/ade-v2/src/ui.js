import { icon as svgIcon, avatar as avatarMark } from "./icons.js";
import { STATUS, project, person, relative } from "./data.js";

export const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

export const inline = (value) => esc(value).replace(/`([^`]+)`/g, '<span class="code">$1</span>');
export const icon = (name, size = 16, extra = "") => svgIcon(name, size, extra);
export const avatar = (participant, size = 28) => avatarMark(participant, size);

export function statusChip(status, { label, className = "" } = {}) {
  const meta = STATUS[status] || { label: status, tone: "slate" };
  return `<span class="status tone-${meta.tone} status--${status} ${className}"><i class="dot"></i>${esc(label || meta.label)}</span>`;
}

export function toneFor(status) {
  return `tone-${STATUS[status]?.tone || "slate"}`;
}

export function avatarFor(id, size = 28) {
  const participant = person(id);
  if (!participant) return "";
  return avatar(participant, size);
}

export function personName(id) {
  return person(id)?.name || id || "unassigned";
}

export function personLink(id, { avatarSize = 18, className = "" } = {}) {
  const participant = person(id);
  if (!participant) return `<span class="faint">unassigned</span>`;
  return `<a class="row ${className}" href="#/agent/${esc(participant.id)}">${avatar(participant, avatarSize)}<span>${esc(participant.name)}</span></a>`;
}

export function pageHead({ crumbs = null, eyebrow = null, title, subtitle = "", actions = "", back = null }) {
  const crumbHtml = crumbs
    ? `<div class="breadcrumbs">${back ? `<a class="back-arrow" href="#${esc(back.href)}" aria-label="Back to ${esc(back.label)}">${icon("arrowLeft", 13)}</a>` : ""}${crumbs
        .map((crumb, index) =>
          index === crumbs.length - 1
            ? `<span>${esc(crumb.label)}</span>`
            : `<a href="#${esc(crumb.href)}">${esc(crumb.label)}</a><span class="sep">/</span>`,
        )
        .join("")}</div>`
    : `<div class="eyebrow">${eyebrow?.icon ? icon(eyebrow.icon, 13) : ""}${esc(eyebrow?.label || "")}</div>`;
  return `<header class="page-head">
    <div class="page-head-main">
      ${crumbHtml}
      <h1 class="page-title">${esc(title)}</h1>
      ${subtitle ? `<p class="page-sub">${subtitle}</p>` : ""}
    </div>
    ${actions ? `<div class="page-actions">${actions}</div>` : ""}
  </header>`;
}

export function panel({ title = "", iconName = null, action = "", body = "", flush = false, className = "", foot = "" }) {
  return `<section class="panel ${flush ? "panel--flush" : ""} ${className}">
    ${
      title
        ? `<div class="panel-head"><div class="panel-title">${iconName ? icon(iconName, 14) : ""}${esc(title)}</div>${action}</div>`
        : ""
    }
    ${body}
    ${foot ? `<div class="panel-foot">${foot}</div>` : ""}
  </section>`;
}

export function sectionHead(title, count = null, action = "") {
  return `<div class="section-head"><div class="section-title">${esc(title)}${count !== null ? ` <span class="count">${count}</span>` : ""}</div>${action}</div>`;
}

export function emptyState({ iconName = "home", title, body = "", action = "" }) {
  return `<div class="empty"><div class="empty-icon">${icon(iconName, 18)}</div><h3>${esc(title)}</h3>${body ? `<p>${body}</p>` : ""}${action}</div>`;
}

export function tabs(basePath, active, items) {
  return `<nav class="tabs" aria-label="Sections">${items
    .map(
      (item) =>
        `<a class="tab" href="#${esc(basePath)}?tab=${esc(item.id)}"${item.id === active ? ' aria-current="page"' : ""}>${esc(item.label)}${item.count !== undefined ? `<span class="count">${item.count}</span>` : ""}</a>`,
    )
    .join("")}</nav>`;
}

export function fact(label, value, { full = false, muted = false } = {}) {
  return `<div class="fact ${full ? "fact--full" : ""}"><dt>${esc(label)}</dt><dd class="${muted ? "muted" : ""}">${value}</dd></div>`;
}

export const code = (value) => `<span class="code">${esc(value)}</span>`;
export const when = (iso) => relative(iso);

export function projectLink(id) {
  const item = project(id);
  return item ? `<a class="link" href="#/project/${esc(item.id)}">${esc(item.name)}</a>` : "";
}

export function objectiveLink(id, title) {
  return `<a href="#/objective/${esc(id)}">${esc(title)}</a>`;
}

export function countDot(tone, count, label) {
  return `<span class="count tone-${tone}"><i></i><b>${count}</b> ${esc(label)}</span>`;
}

export function statusCounts(counts) {
  const order = ["open", "claimed", "verified", "accepted", "blocked", "parked", "rejected"];
  return `<div class="counts">${order
    .filter((status) => counts[status])
    .map((status) => countDot(STATUS[status].tone, counts[status], STATUS[status].label.toLowerCase()))
    .join("")}</div>`;
}

export function miniBar(counts, height = 4) {
  const order = ["open", "claimed", "verified", "accepted", "blocked", "parked", "rejected"];
  const total = order.reduce((sum, key) => sum + (counts[key] || 0), 0) || 1;
  return `<div class="progress" style="height:${height}px" aria-hidden="true">${order
    .filter((key) => counts[key])
    .map((key) => `<span class="tone-${STATUS[key].tone}" style="flex:${counts[key]};--seg:var(--${STATUS[key].tone === "slate" ? "slate" : STATUS[key].tone})"></span>`)
    .join("")}</div>`;
}

export function timeAgo(iso) {
  return `<span class="mono">${esc(relative(iso))}</span>`;
}

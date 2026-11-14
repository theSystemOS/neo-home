import { people, projects, workspace } from "../data.js";
import { esc, icon, pageHead, panel } from "../ui.js";

const harnesses = [
  { id: "dsh", name: "DSH / Cordis", detail: "The intended execution and composition layer", status: "not installed", tone: "gold", icon: "cpu" },
  { id: "shell", name: "Local shell", detail: "A local process surface; no adapter is registered", status: "available", tone: "slate", icon: "terminal" },
  { id: "browser", name: "Browser", detail: "Not configured for this workspace", status: "off", tone: "slate", icon: "globe" },
];

const environments = [
  { name: "Local workstation", detail: "macOS · this machine · 12 GB free", status: "online", tone: "green", icon: "globe" },
  { name: "Staging host", detail: "northstar-atlas · reachable read-only", status: "remote", tone: "cyan", icon: "database" },
];

function row({ iconName, name, detail, status, tone, action = true }) {
  return `<div class="connection-row">
    <span class="connection-icon">${icon(iconName, 15)}</span>
    <div class="connection-main"><b>${esc(name)}</b><span>${esc(detail)}</span></div>
    <div class="connection-action"><span class="status tone-${tone}"><i class="dot"></i>${esc(status)}</span>${action ? `<button class="icon-btn" data-action="connection" data-name="${esc(name)}" aria-label="Configure ${esc(name)}">${icon("more", 15)}</button>` : ""}</div>
  </div>`;
}

export function connectionsScreen() {
  const main = `<div class="screen">
    ${pageHead({
      eyebrow: { icon: "connections", label: "Machine" },
      title: "Connections",
      subtitle: "The surface is only as honest as what it can reach. Harnesses execute, repositories hold artifacts, environments run the work, and MCP servers widen the tool boundary. None of them is the record.",
      actions: `<button class="btn btn-secondary" data-action="connection" data-name="Harness adapter">${icon("plus", 14)} Add connection</button>`,
    })}
    <div class="connections-grid">
      ${panel({
        title: "Harnesses",
        iconName: "cpu",
        action: `<span class="section-action">1 of 3 connected</span>`,
        body: harnesses.map((harness) => row({ iconName: harness.icon, name: harness.name, detail: harness.detail, status: harness.status, tone: harness.tone })).join(""),
        flush: true,
      })}
      ${panel({
        title: "Repositories",
        iconName: "branch",
        action: `<span class="section-action">${projects.length} linked</span>`,
        body: projects.map((item) => row({ iconName: "branch", name: item.repo, detail: `${item.branch} · ${item.environment} · ${item.name}`, status: "synced", tone: "green" })).join(""),
        flush: true,
      })}
      ${panel({
        title: "Environments",
        iconName: "globe",
        action: `<span class="section-action">${environments.length} known</span>`,
        body: environments.map((environment) => row({ iconName: environment.icon, name: environment.name, detail: environment.detail, status: environment.status, tone: environment.tone })).join(""),
        flush: true,
      })}
      ${panel({
        title: "MCP",
        iconName: "link",
        action: `<span class="section-action">0 servers</span>`,
        body: row({ iconName: "link", name: "No MCP servers", detail: "Docs, database and memory servers would appear here", status: "not configured", tone: "slate" }),
        flush: true,
      })}
    </div>
    <div class="callout quiet" style="margin-top:16px;display:flex;gap:10px">${icon("lock", 15)}<div><div class="callout-title">A connection is not permission</div><div class="callout-body">Reaching a system does not authorize an action on it. The adapter checks the applicable grant before a side effect; the connection only makes the attempt possible.</div></div></div>
  </div>`;

  const inspector = `
    <div class="inspector-head"><span class="label">Runtime</span><span class="status tone-gold"><i class="dot"></i>partly connected</span></div>
    ${panel({
      title: "This machine",
      iconName: "cpu",
      body: `<dl class="facts">
        ${`<div class="fact"><dt>Workspace</dt><dd>${esc(workspace.name)}</dd></div>`}
        ${`<div class="fact"><dt>Ledger</dt><dd>${workspace.ledgerEvents} events</dd></div>`}
        ${`<div class="fact"><dt>Repositories</dt><dd>${projects.length}</dd></div>`}
        ${`<div class="fact"><dt>Participants</dt><dd>${people.length}</dd></div>`}
      </dl>`,
    })}
    ${panel({
      title: "What is not wired",
      iconName: "alert",
      body: `<p class="small faint" style="line-height:1.6">This prototype has no executor, no authentication and no repository writes. Actions are illustrative state. The connected build will land in the same composition.</p>
      <div class="divider"></div>
      <a class="btn btn-secondary btn-sm" href="#/runs" style="width:100%">${icon("runs", 13)} Review runs</a>`,
    })}`;

  return { title: "Connections · neo-home", main, inspector };
}

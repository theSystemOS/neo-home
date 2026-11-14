import {
  activeRuns,
  needsYou,
  objectives,
  people,
  projects,
  proposals,
  runs,
  workspace,
} from "./data.js";
import { avatar, esc, icon } from "./ui.js";
import { navigate, onRouteChange, route } from "./router.js";
import { bump, subscribe } from "./store.js";
import { closePalette, openPalette } from "./palette.js";
import { startTour } from "./tour.js";
import { openModal, toast } from "./overlays.js";
import {
  acceptFlow,
  addParticipantFlow,
  blockFlow,
  claimFlow,
  contributionFlow,
  delegateFlow,
  newObjectiveFlow,
  newProjectFlow,
  parkFlow,
  reopenFlow,
  rejectFlow,
  reviseFlow,
  verifyFlow,
} from "./flows.js";
import { home } from "./screens/home.js";
import { projectsScreen } from "./screens/projects.js";
import { projectScreen } from "./screens/project.js";
import { objectiveScreen } from "./screens/objective.js";
import { runsScreen } from "./screens/runs.js";
import { runScreen } from "./screens/run.js";
import { agentsScreen, agentScreen } from "./screens/agents.js";
import { decisionsScreen } from "./screens/decisions.js";
import { evidenceScreen } from "./screens/evidence.js";
import { connectionsScreen } from "./screens/connections.js";

const app = document.getElementById("app");
const state = { inspectorOpen: window.innerWidth > 1180 };
let lastPath = null;
let gPressedAt = 0;

const NAV = [
  { label: "Home", icon: "home", href: "/home", match: (path) => path === "/home" },
  { label: "Decisions", icon: "decisions", href: "/decisions", match: (path) => path.startsWith("/decisions"), count: () => objectives.filter((item) => item.status === "verified").length + proposals().filter((entry) => ["open", "claimed"].includes(entry.objective.status)).length + objectives.filter((item) => item.status === "blocked").length },
  { label: "Runs", icon: "runs", href: "/runs", match: (path) => path.startsWith("/run"), count: () => runs.filter((item) => item.status === "running").length, warm: true },
  { label: "Agents", icon: "agents", href: "/agents", match: (path) => path.startsWith("/agent") },
  { label: "Projects", icon: "projects", href: "/projects", match: (path) => path.startsWith("/project") },
  { label: "Evidence", icon: "evidence", href: "/evidence", match: (path) => path.startsWith("/evidence") },
  { label: "Connections", icon: "connections", href: "/connections", match: (path) => path.startsWith("/connections") },
];

function resolve(current) {
  const [section, id] = current.segments;
  switch (section) {
    case undefined:
    case "home":
      return home();
    case "projects":
      return projectsScreen();
    case "project":
      return projectScreen({ id, tab: current.query.get("tab") || "board" });
    case "objective":
      return objectiveScreen({ id, tab: current.query.get("tab") || "overview" });
    case "runs":
      return runsScreen({ status: current.query.get("status") || "all" });
    case "run":
      return runScreen({ id });
    case "agents":
      return agentsScreen();
    case "agent":
      return agentScreen({ id });
    case "decisions":
      return decisionsScreen();
    case "evidence":
      return evidenceScreen();
    case "connections":
      return connectionsScreen();
    default:
      return home();
  }
}

function rail() {
  const current = route();
  const counts = {
    decisions: objectives.filter((item) => item.status === "verified").length + proposals().filter((entry) => ["open", "claimed"].includes(entry.objective.status)).length + objectives.filter((item) => item.status === "blocked").length,
    runs: runs.filter((item) => item.status === "running").length,
  };
  document.getElementById("rail").innerHTML = `
    <a class="brand" href="#/home" aria-label="neo-home home">
      <span class="brand-mark">${icon("projects", 14)}</span>
      <span class="brand-name"><b>neo-home</b><span>ADE · EXOS</span></span>
    </a>
    <button class="workspace" data-action="palette">
      <span class="ws-glyph">N</span>
      <span class="ws-text"><b>${esc(workspace.name)}</b><small>workspace</small></span>
      ${icon("chevronDown", 13)}
    </button>
    <nav class="rail-nav" aria-label="Primary">
      ${NAV.map((item) => {
        const count = item.count ? item.count() : 0;
        return `<a class="nav-item" href="#${item.href}"${item.match(current.path) ? ' aria-current="page"' : ""} aria-label="${esc(item.label)}" title="${esc(item.label)}">
          ${icon(item.icon, 16)}<span>${esc(item.label)}</span>
          ${count ? `<span class="nav-count ${item.warm ? "warm" : ""}">${count}</span>` : ""}
        </a>`;
      }).join("")}
    </nav>
    <div class="rail-section"><span>Projects</span><button data-action="new-project" aria-label="New project">${icon("plus", 12)}</button></div>
    <div class="rail-projects">${projects
      .map((item) => {
        const count = objectives.filter((objective) => objective.projectId === item.id).length;
        return `<a class="project-link" href="#/project/${item.id}" style="--proj:var(--${item.accent})"${current.path === `/project/${item.id}` ? ' aria-current="page"' : ""} aria-label="${esc(item.name)}" title="${esc(item.name)}"><i class="project-dot"></i><span class="proj-name">${esc(item.name)}</span><span class="proj-count">${count}</span></a>`;
      })
      .join("")}</div>
    <div class="rail-foot">
      <div class="foot-row"><i class="dot-live"></i><span>Prototype ledger</span><b>${workspace.ledgerEvents}</b><span>events</span></div>
      <div class="foot-row"><i class="dot-live warn"></i><span>Adapter offline</span><b>prototype</b></div>
    </div>`;
}

function topbar() {
  const current = route();
  const routeObjective = current.segments[0] === "objective" ? objectives.find((item) => item.id === current.segments[1]) : null;
  const projectContext = current.segments[0] === "project" ? current.segments[1] : routeObjective?.projectId || projects[0]?.id;
  document.getElementById("topbar").innerHTML = `
    <div class="topbar-left">
      <span class="crumb">${esc(workspace.name)}</span><span class="crumb-sep">/</span><span class="crumb-muted">${esc(workspace.environment)}</span>
    </div>
    <button class="command-trigger" data-action="palette" aria-label="Open command palette">${icon("search", 15)}<span>Search or jump to…</span><kbd>⌘K</kbd></button>
    <div class="topbar-right">
      <button class="btn btn-primary btn-sm" data-action="new-objective" data-project="${projectContext}" aria-label="New objective">${icon("plus", 13)}<span>New objective</span></button>
      <span class="sep"></span>
      <button class="icon-btn" data-action="tour" aria-label="Take the tour" title="Take the tour">${icon("tour", 16)}</button>
      <button class="icon-btn" data-action="toggle-inspector" aria-label="Toggle context panel" aria-pressed="${state.inspectorOpen}" title="Toggle context panel">${icon("panel", 16)}</button>
      <a class="avatar-btn" href="#/agent/mira" aria-label="Your profile">${avatar(people.find((participant) => participant.id === "mira"), 26)}<span class="who"><b>Mira Chen</b><span>operator</span></span></a>
    </div>`;
}

function statusbar() {
  document.getElementById("statusbar").innerHTML = `
    <span class="status-item"><i class="dot-live"></i><b>Prototype ledger</b></span>
    <span class="status-item">${workspace.ledgerEvents} events · head ${workspace.head}</span>
    <span class="status-item"><i class="dot-live warn"></i>Execution adapter not connected</span>
    <span class="status-spacer"></span>
    <span class="status-item"><span class="tag tone-gold">illustrative prototype</span></span>
    <span class="status-hint"><kbd>⌘K</kbd> command <kbd>G</kbd><kbd>H</kbd> home <kbd>?</kbd> map</span>`;
}

function applyInspector() {
  const narrow = window.innerWidth <= 1180;
  app.classList.toggle("inspector-open", state.inspectorOpen && narrow);
  app.classList.toggle("inspector-closed", !state.inspectorOpen && !narrow);
  const button = document.querySelector('[data-action="toggle-inspector"]');
  if (button) {
    button.dataset.active = String(state.inspectorOpen);
    button.setAttribute("aria-pressed", String(state.inspectorOpen));
  }
}

function render({ preserveScroll = false } = {}) {
  const current = route();
  const screen = resolve(current);
  const before = document.getElementById("main").scrollTop;
  rail();
  topbar();
  statusbar();
  document.getElementById("main").innerHTML = screen.main;
  document.getElementById("inspector").innerHTML = screen.inspector;
  document.title = screen.title || "neo-home";
  applyInspector();
  if (!preserveScroll || lastPath !== current.path) {
    if (lastPath !== null) document.getElementById("main").scrollTop = 0;
  } else {
    document.getElementById("main").scrollTop = before;
  }
  lastPath = current.path;
}

function showHelp() {
  openModal({
    title: "Keyboard map",
    sub: "The surface is built to be driven without the mouse.",
    body: `<div class="stack-sm">
      ${[
        ["⌘ K", "Command palette"],
        ["G then H", "Home"],
        ["G then P", "Projects"],
        ["G then R", "Runs"],
        ["G then A", "Participants"],
        ["G then D", "Decisions"],
        ["G then E", "Evidence"],
        ["G then C", "Connections"],
        ["?", "This map"],
        ["Esc", "Close a panel or dialog"],
      ].map(([keys, label]) => `<div class="row row--between" style="padding:8px 0;border-top:1px solid var(--line)"><span class="small muted">${label}</span><span class="row" style="gap:4px">${keys.split(" ").map((key) => `<span class="kbd">${esc(key)}</span>`).join("")}</span></div>`).join("")}
    </div>`,
    submit: "Close",
    onSubmit: () => true,
  });
}

function connectionModal(name) {
  openModal({
    title: `Connection · ${name}`,
    sub: "A connection makes an attempt possible. It does not authorize an action.",
    body: `<div class="callout tone-gold"><div class="callout-title">${icon("alert", 12)} Prototype only</div><div class="callout-body">The connected build will configure this connection through the profile, save it to the record, and check grants at the action boundary. Nothing is written here.</div></div>`,
    submit: "Close",
    onSubmit: () => true,
  });
}

function handleAction(action, element) {
  const id = element.dataset.id;
  const item = id ? objectives.find((objective) => objective.id === id) : null;
  switch (action) {
    case "palette":
      openPalette();
      break;
    case "tour":
      startTour();
      break;
    case "toggle-inspector":
      state.inspectorOpen = !state.inspectorOpen;
      applyInspector();
      break;
    case "new-objective": {
      const current = route();
      const projectId =
        element.dataset.project ||
        (current.segments[0] === "project" ? current.segments[1] : null) ||
        (item ? item.projectId : null) ||
        projects[0]?.id;
      newObjectiveFlow(projectId);
      break;
    }
    case "new-project":
      newProjectFlow();
      break;
    case "add-participant":
      addParticipantFlow();
      break;
    case "help":
      showHelp();
      break;
    case "objective-claim":
      if (item) claimFlow(item);
      break;
    case "objective-contribution":
      if (item) contributionFlow(item);
      break;
    case "objective-verify":
      if (item) verifyFlow(item);
      break;
    case "objective-accept":
      if (item) acceptFlow(item);
      break;
    case "objective-reject":
      if (item) rejectFlow(item);
      break;
    case "objective-block":
      if (item) blockFlow(item);
      break;
    case "objective-park":
      if (item) parkFlow(item);
      break;
    case "objective-reopen":
      if (item) reopenFlow(item);
      break;
    case "objective-revise":
      if (item) reviseFlow(item);
      break;
    case "objective-delegate":
      if (item) delegateFlow(item);
      break;
    case "connection":
      connectionModal(element.dataset.name || "Connection");
      break;
    default:
      break;
  }
}

document.addEventListener("click", (event) => {
  const actionElement = event.target.closest("[data-action]");
  if (actionElement) {
    event.preventDefault();
    handleAction(actionElement.dataset.action, actionElement);
    return;
  }
  const link = event.target.closest("tr[data-href]");
  if (link) navigate(link.dataset.href.replace(/^#/, ""));
});

document.addEventListener("ade-help", showHelp);

document.addEventListener("keydown", (event) => {
  const typing = event.target.closest("input, textarea, select, [contenteditable='true']");
  if (typing) return;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openPalette();
    return;
  }
  if (event.key === "?" && !event.metaKey && !event.ctrlKey) {
    event.preventDefault();
    showHelp();
    return;
  }
  if (event.key === "/" && !event.metaKey && !event.ctrlKey) {
    event.preventDefault();
    openPalette();
    return;
  }
  if (event.key === "g") {
    gPressedAt = Date.now();
    return;
  }
  if (gPressedAt && Date.now() - gPressedAt < 900) {
    const map = { h: "/home", p: "/projects", r: "/runs", a: "/agents", d: "/decisions", e: "/evidence", c: "/connections" };
    const target = map[event.key.toLowerCase()];
    gPressedAt = 0;
    if (target) {
      event.preventDefault();
      navigate(target);
    }
  }
  if (event.key === "Escape" && state.inspectorOpen && window.innerWidth <= 1180) {
    state.inspectorOpen = false;
    applyInspector();
  }
});

let lastNarrow = window.innerWidth <= 1180;
addEventListener("resize", () => {
  const narrow = window.innerWidth <= 1180;
  if (narrow !== lastNarrow) {
    state.inspectorOpen = !narrow;
    lastNarrow = narrow;
  }
  applyInspector();
});

document.addEventListener("keydown", (event) => {
  const row = event.target.closest("tr[data-href]");
  if (row && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    navigate(row.dataset.href.replace(/^#/, ""));
  }
});
addEventListener("hashchange", () => {
  closePalette();
  document.getElementById("toast-root").innerHTML = "";
  render();
});
subscribe(() => render({ preserveScroll: true }));
render();

import { objectives, people, projects } from "./data.js";
import { icon } from "./icons.js";
import { navigate } from "./router.js";
import { newObjectiveFlow, newProjectFlow, addParticipantFlow } from "./flows.js";
import { esc } from "./ui.js";
import { startTour } from "./tour.js";

let active = false;
let filtered = [];
let selected = 0;
let keyHandler = null;

function items() {
  const nav = [
    { group: "Navigate", label: "Home", sub: "Command surface", icon: "home", action: () => navigate("/home") },
    { group: "Navigate", label: "Decisions", sub: "What needs a person", icon: "decisions", action: () => navigate("/decisions") },
    { group: "Navigate", label: "Runs", sub: "Execution and operations", icon: "runs", action: () => navigate("/runs") },
    { group: "Navigate", label: "Participants", sub: "People and agents", icon: "agents", action: () => navigate("/agents") },
    { group: "Navigate", label: "Projects", sub: "Portfolio", icon: "projects", action: () => navigate("/projects") },
    { group: "Navigate", label: "Evidence", sub: "What the record supports", icon: "evidence", action: () => navigate("/evidence") },
    { group: "Navigate", label: "Connections", sub: "Harnesses, repositories, environments", icon: "connections", action: () => navigate("/connections") },
  ];
  const participantItems = people.map((participant) => ({
    group: "Participants",
    label: participant.name,
    sub: `${participant.role} · ${participant.kind}`,
    icon: participant.kind === "human" ? "user" : "agents",
    action: () => navigate(`/agent/${participant.id}`),
  }));
  const projectItems = projects.map((item) => ({
    group: "Projects",
    label: item.name,
    sub: `${item.repo} · ${item.branch}`,
    icon: "projects",
    action: () => navigate(`/project/${item.id}`),
  }));
  const objectiveItems = objectives.map((item) => ({
    group: "Objectives",
    label: `${item.id} · ${item.title}`,
    sub: projects.find((project) => project.id === item.projectId)?.name || "",
    icon: "decisions",
    action: () => navigate(`/objective/${item.id}`),
  }));
  const actionItems = [
    { group: "Actions", label: "New objective", sub: "Open a direction", icon: "plus", action: () => newObjectiveFlow() },
    { group: "Actions", label: "New project", sub: "Open a scope of work", icon: "plus", action: () => newProjectFlow() },
    { group: "Actions", label: "Add participant", sub: "A person or an agent", icon: "plus", action: () => addParticipantFlow() },
    { group: "Actions", label: "Take the tour", sub: "Seven screens, two minutes", icon: "tour", action: () => startTour() },
    { group: "Actions", label: "Keyboard map", sub: "Every shortcut", icon: "command", action: () => document.dispatchEvent(new CustomEvent("ade-help")) },
  ];
  return [...nav, ...participantItems, ...projectItems, ...objectiveItems, ...actionItems];
}

function render() {
  const root = document.getElementById("overlay-root");
  const query = root.querySelector("#palette-input")?.value.trim().toLowerCase() || "";
  const all = items();
  filtered = all.filter((item) => {
    if (!query) return true;
    return `${item.label} ${item.sub} ${item.group}`.toLowerCase().includes(query);
  });
  if (selected >= filtered.length) selected = Math.max(0, filtered.length - 1);
  const groups = [...new Set(filtered.map((item) => item.group))];
  const list = root.querySelector("#palette-list");
  list.innerHTML = groups.length
    ? groups
        .map(
          (group) => `<div class="palette-group">${esc(group)}</div>${filtered
            .map((item, index) => ({ item, index }))
            .filter((entry) => entry.item.group === group)
            .map(
              ({ item, index }) => `<button class="palette-item" data-index="${index}" aria-selected="${index === selected}">
                ${icon(item.icon, 15)}
                <span class="pi-main"><b>${esc(item.label)}</b><span>${esc(item.sub)}</span></span>
                ${index === selected ? `<span class="kbd">↵</span>` : ""}
              </button>`,
            )
            .join("")}`,
        )
        .join("")
    : `<div class="palette-empty">Nothing matches “${esc(query)}”.</div>`;
  list.querySelectorAll(".palette-item").forEach((button) => {
    button.onclick = () => {
      run(Number(button.dataset.index));
    };
  });
  if (filtered[selected]) {
    const activeItem = list.querySelector(`[data-index="${selected}"]`);
    activeItem?.scrollIntoView({ block: "nearest" });
  }
}

function run(index) {
  const item = filtered[index];
  if (!item) return;
  closePalette();
  item.action();
}

export function openPalette() {
  if (active) return;
  active = true;
  selected = 0;
  const root = document.getElementById("overlay-root");
  root.innerHTML = `<div class="palette-backdrop" data-palette-backdrop>
    <div class="palette" role="dialog" aria-modal="true" aria-label="Command palette">
      <div class="palette-input">${icon("search", 16)}<input id="palette-input" type="text" placeholder="Search screens, projects, objectives, actions…" autocomplete="off" spellcheck="false" aria-label="Search" /><kbd>esc</kbd></div>
      <div class="palette-list" id="palette-list" role="listbox"></div>
      <div class="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span><span style="margin-left:auto">${objectives.length} objectives · ${projects.length} projects</span></div>
    </div>
  </div>`;
  const input = root.querySelector("#palette-input");
  input.addEventListener("input", () => {
    selected = 0;
    render();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      selected = Math.min(filtered.length - 1, selected + 1);
      render();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      selected = Math.max(0, selected - 1);
      render();
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(selected);
    }
  });
  root.querySelector("[data-palette-backdrop]").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closePalette();
  });
  keyHandler = (event) => {
    if (event.key === "Escape") closePalette();
  };
  addEventListener("keydown", keyHandler);
  render();
  requestAnimationFrame(() => input.focus());
}

export function closePalette() {
  if (!active) return;
  active = false;
  if (keyHandler) removeEventListener("keydown", keyHandler);
  keyHandler = null;
  const root = document.getElementById("overlay-root");
  root.innerHTML = "";
}

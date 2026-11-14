import { icon } from "./icons.js";
import { navigate } from "./router.js";
import { esc } from "./ui.js";
import { toast } from "./overlays.js";

const steps = [
  { route: "/home", title: "Your command surface", body: "Every project, participant, run and decision arrives here. The rail is the map; the status bar tells you what the ledger and the executor can actually claim." },
  { route: "/decisions", title: "What needs a person", body: "Verified work waits for acceptance. Proposals wait for a decision. Blocked and parked paths stay visible until their condition changes." },
  { route: "/project/field-notes", title: "A project is a continuing direction", body: "The board groups objectives by actual standing, not by a status list you have to interpret. Each card carries its owner and its evidence." },
  { route: "/objective/FN-001", title: "An objective room", body: "Intent, authority, conditions, contributions and evidence live together. The owner cannot verify their own work; a person accepts after verification." },
  { route: "/run/RUN-014", title: "Execution is inspectable", body: "A run reports its real lifecycle: started, tool calls, checkpoints, artifacts, failures. It does not report a percentage or a success it has not proved." },
  { route: "/agents", title: "Participants, not personas", body: "Roles and capabilities shape behavior. Grants decide reach. A model change never silently widens what an agent may do." },
  { route: "/connections", title: "The machine underneath", body: "Harnesses execute, repositories hold artifacts, environments run the work, and MCP widens the tool boundary. None of them is the record." },
];

let index = 0;

function card() {
  return `<div class="tour-card" id="tour-card" role="dialog" aria-label="Product tour">
    <div class="tour-head"><span class="tour-step">Tour · ${index + 1} / ${steps.length}</span><button class="icon-btn" data-tour-skip aria-label="Skip tour">${icon("close", 15)}</button></div>
    <div class="tour-body"><h3>${esc(steps[index].title)}</h3><p>${esc(steps[index].body)}</p></div>
    <div class="tour-foot">
      <div class="tour-progress">${steps.map((_, stepIndex) => `<i class="${stepIndex <= index ? "on" : ""}"></i>`).join("")}</div>
      ${index > 0 ? `<button class="btn btn-ghost btn-sm" data-tour-prev>Back</button>` : ""}
      <button class="btn btn-primary btn-sm" data-tour-next>${index === steps.length - 1 ? "Finish" : "Next"}</button>
    </div>
  </div>`;
}

function render() {
  document.getElementById("tour-card")?.remove();
  document.body.insertAdjacentHTML("beforeend", card());
  document.querySelector("[data-tour-next]").onclick = next;
  document.querySelector("[data-tour-skip]").onclick = finish;
  const previous = document.querySelector("[data-tour-prev]");
  if (previous) previous.onclick = prev;
}

function next() {
  if (index >= steps.length - 1) {
    finish();
    return;
  }
  index += 1;
  navigate(steps[index].route);
  render();
}

function prev() {
  if (index === 0) return;
  index -= 1;
  navigate(steps[index].route);
  render();
}

function finish() {
  document.getElementById("tour-card")?.remove();
  toast({ title: "Tour complete", body: "The prototype is yours to explore. Press ⌘K anywhere.", tone: "cyan" });
}

export function startTour() {
  index = 0;
  navigate(steps[index].route);
  render();
}

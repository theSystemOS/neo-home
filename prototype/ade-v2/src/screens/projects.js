import { activity, objectives, people, projectCounts, projects, relative, runs, workspace } from "../data.js";
import { esc, icon, miniBar, pageHead, panel } from "../ui.js";

function portfolioRow(item) {
  const counts = projectCounts(item.id);
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const owner = people.find((participant) => participant.id === item.ownerId);
  return `<a class="portfolio-row" href="#/project/${item.id}">
    <div class="portfolio-name">
      <span class="portfolio-glyph" style="--proj:var(--${item.accent})">${esc(item.name.slice(0, 2).toUpperCase())}</span>
      <div><b>${esc(item.name)}</b><p>${esc(item.purpose)}</p></div>
    </div>
    <div class="portfolio-status">
      <div class="counts">${["open", "claimed", "verified", "accepted", "blocked"]
        .filter((status) => counts[status])
        .map((status) => `<span class="count tone-${status === "open" ? "slate" : status === "claimed" ? "cyan" : status === "verified" ? "green" : status === "accepted" ? "gold" : "red"}"><i></i><b>${counts[status]}</b> ${status}</span>`)
        .join("")}</div>
      <div style="margin-top:8px">${miniBar(counts, 3)}</div>
    </div>
    <div class="portfolio-repo"><b>${esc(item.repo)}</b><br>${esc(item.branch)} · ${esc(item.environment)}</div>
    <div class="portfolio-when">${total} objectives<br>${esc(relative(item.updatedAt))}<br><span class="faint">${esc(owner?.name || "")}</span></div>
  </a>`;
}

export function projectsScreen() {
  const main = `<div class="screen">
    ${pageHead({
      eyebrow: { icon: "projects", label: `Portfolio · ${workspace.name}` },
      title: "Projects",
      subtitle: "Continuing directions, each with its own board, participants and evidence. A project is a scope of work that keeps its meaning, not a folder.",
      actions: `<button class="btn btn-secondary" data-action="palette">${icon("search", 14)} Jump to…</button><button class="btn btn-primary" data-action="new-project">${icon("plus", 14)} New project</button>`,
    })}
    <div class="portfolio">${projects.map(portfolioRow).join("")}</div>
  </div>`;

  const live = runs.filter((run) => run.status === "running");
  const inspector = `
    <div class="inspector-head"><span class="label">Portfolio</span><span class="status status--plain"><i class="dot"></i>${projects.length} projects</span></div>
    ${panel({
      title: "State",
      iconName: "activity",
      body: `<dl class="facts">
        <div class="fact"><dt>Objectives</dt><dd>${objectives.length}</dd></div>
        <div class="fact"><dt>In flight</dt><dd>${live.length}</dd></div>
        <div class="fact"><dt>Participants</dt><dd>${people.length}</dd></div>
        <div class="fact"><dt>Evidence</dt><dd>2 records</dd></div>
      </dl>
      <div class="divider"></div>
      <p class="small faint" style="line-height:1.5">Each project keeps a separate standing. Work that spans projects is linked by reference, never merged silently.</p>`,
    })}
    ${panel({
      title: "Recent",
      iconName: "clock",
      body: activity.slice(0, 5).map((entry) => `<div class="activity-mini"><time>${esc(relative(entry.t))}</time><p><b>${esc(people.find((participant) => participant.id === entry.actorId)?.name || entry.actorId)}</b> ${esc(entry.text)} <a href="#/${entry.route}">${esc(entry.target)}</a></p></div>`).join(""),
      flush: true,
    })}`;
  return { title: "Projects · neo-home", main, inspector };
}

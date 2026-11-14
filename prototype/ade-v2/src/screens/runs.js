import { elapsed, objectives, person, project, relative, runs } from "../data.js";
import { avatarFor, emptyState, esc, icon, pageHead, panel, statusChip } from "../ui.js";

const FILTERS = ["all", "running", "ended", "failed"];

export function runsScreen({ status = "all" } = {}) {
  const list = status === "all" ? runs : runs.filter((run) => run.status === status);
  const counts = FILTERS.reduce((result, key) => ({ ...result, [key]: key === "all" ? runs.length : runs.filter((run) => run.status === key).length }), {});

  const main = `<div class="screen">
    ${pageHead({
      eyebrow: { icon: "runs", label: "Execution" },
      title: "Runs",
      subtitle: "An operation is inspectable from the moment it starts to the moment it ends. Running, ended and failed are different facts; none of them is acceptance.",
      actions: `<a class="btn btn-secondary" href="#/connections">${icon("connections", 14)} Connections</a>`,
    })}
    <div class="run-banner">${icon("alert", 13)} <span><b>Illustrative execution.</b> No harness adapter is connected in this prototype; these runs demonstrate the surface, not a live executor.</span></div>
    <div class="filter-bar" style="margin-bottom:12px">${FILTERS.map((key) => `<a class="filter" href="#/runs${key === "all" ? "" : `?status=${key}`}"${key === status ? ' aria-pressed="true"' : ""}>${key} <span class="count">${counts[key]}</span></a>`).join("")}</div>
    ${
      list.length
        ? `<div class="panel panel--flush table-wrap"><table class="data-table">
            <thead><tr><th>Run</th><th>Objective</th><th>Participant</th><th>Status</th><th>Started</th><th>Duration</th><th>Evidence</th></tr></thead>
            <tbody>${list
              .map((run) => {
                const item = objectives.find((candidate) => candidate.id === run.objectiveId);
                return `<tr data-href="#/run/${run.id}" tabindex="0" role="link" aria-label="Open run ${run.id}">
                  <td><span class="mono">${esc(run.id)}</span></td>
                  <td><div class="cell-title"><b>${esc(item?.title || run.objectiveId)}</b><span>${esc(project(item?.projectId)?.name || "")}</span></div></td>
                  <td><span class="row" style="gap:7px">${avatarFor(run.participantId, 20)}<span>${esc(person(run.participantId)?.name)}</span></span></td>
                  <td>${statusChip(run.status)}</td>
                  <td><span class="mono">${esc(relative(run.startedAt))}</span></td>
                  <td><span class="mono">${esc(elapsed(run.startedAt, run.endedAt))}</span></td>
                  <td><span class="mono">${run.evidence.length ? `${run.evidence.length} record` : "—"}</span></td>
                </tr>`;
              })
              .join("")}</tbody>
          </table></div>`
        : emptyState({ iconName: "runs", title: `No ${status === "all" ? "" : status} runs`, body: "When a harness adapter is connected, an operation appears here with its true lifecycle.", action: `<a class="btn btn-secondary" href="#/connections">Review connections</a>` })
    }
  </div>`;

  const failures = runs.filter((run) => run.status === "failed");
  const inspector = `
    <div class="inspector-head"><span class="label">Execution</span><span class="status tone-cyan"><i class="dot"></i>${runs.filter((run) => run.status === "running").length} live</span></div>
    ${panel({
      title: "Adapter",
      iconName: "cpu",
      body: `<div class="row row--between" style="gap:10px"><div><b style="display:block;font:500 12px var(--font-ui)">No executor connected</b><span class="small faint">Running cannot be reported by this build.</span></div><span class="status tone-gold"><i class="dot"></i>offline</span></div>
      <div class="divider"></div>
      <dl class="facts">
        <div class="fact"><dt>Runs</dt><dd>${runs.length}</dd></div>
        <div class="fact"><dt>Live</dt><dd>${runs.filter((run) => run.status === "running").length}</dd></div>
        <div class="fact"><dt>Ended</dt><dd>${runs.filter((run) => run.status === "ended").length}</dd></div>
        <div class="fact"><dt>Failed</dt><dd>${failures.length}</dd></div>
      </dl>
      <div class="divider"></div>
      <a class="btn btn-secondary btn-sm" href="#/connections" style="width:100%">${icon("connections", 13)} Review connections</a>`,
    })}
    ${panel({
      title: "What a run is",
      iconName: "book",
      body: `<p class="small faint" style="line-height:1.6">A run is an operation under a grant. It reports what it did, not what it intends. A checkpoint is durable state; an artifact is a produced file; an error is a real failure.</p>`,
      className: "panel--quiet",
    })}`;

  return { title: "Runs · neo-home", main, inspector };
}

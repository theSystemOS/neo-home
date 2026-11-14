import { elapsed, objective, person, project, relative, run } from "../data.js";
import { avatarFor, code, emptyState, esc, icon, pageHead, panel, statusChip } from "../ui.js";

const EVENT_TONE = {
  start: "cyan",
  tool: "cyan",
  checkpoint: "violet",
  artifact: "violet",
  evidence: "green",
  error: "red",
  end: "green",
};

const EVENT_ICON = {
  start: "play",
  tool: "terminal",
  checkpoint: "flag",
  artifact: "file",
  evidence: "shield",
  error: "alert",
  end: "check",
};

export function runScreen({ id }) {
  const item = run(id);
  if (!item) {
    return {
      title: "Run not found",
      main: `<div class="screen">${emptyState({ iconName: "runs", title: "Run not found", body: "This route does not identify a run in the prototype.", action: `<a class="btn btn-secondary" href="#/runs">Back to runs</a>` })}</div>`,
      inspector: "",
    };
  }
  const parent = objective(item.objectiveId);
  const projectRecord = project(parent?.projectId);
  const live = item.status === "running";

  const main = `<div class="screen">
    ${pageHead({
      crumbs: [{ label: "Runs", href: "/runs" }, { label: item.id }],
      back: { href: "/runs", label: "Runs" },
      eyebrow: { icon: "runs", label: `${item.harness} · operation` },
      title: parent?.title || item.summary,
      subtitle: esc(item.summary),
      actions: `<div class="row" style="gap:8px">${live ? `<span class="run-live"><i class="pulse"></i>live · ${esc(elapsed(item.startedAt))}</span>` : statusChip(item.status)}<span class="mono faint" style="font-size:10px">${esc(item.id)}</span></div>`,
    })}
    <div class="objective-meta" style="margin-bottom:16px">
      <span>${icon("decisions", 12)} <a class="link" href="#/objective/${item.objectiveId}">${esc(parent?.id)}</a></span>
      <span>${icon("user", 12)} <a class="link" href="#/agent/${item.participantId}">${esc(person(item.participantId)?.name)}</a></span>
      <span>${icon("projects", 12)} ${esc(projectRecord?.name)}</span>
      <span>${icon("lock", 12)} grant ${esc(item.grant)}</span>
      <span>${icon("clock", 12)} started ${esc(relative(item.startedAt))}</span>
    </div>
    <div class="objective-grid">
      <div class="stack">
        ${panel({
          title: "Operation timeline",
          iconName: "activity",
          action: `<span class="section-action">${item.events.length} events · ${esc(elapsed(item.startedAt, item.endedAt))}</span>`,
          body: `<div class="run-timeline"><div class="timeline">${item.events
            .map(
              (event) => `<div class="timeline-item">
                <div class="timeline-rail"><span class="timeline-mark tone-${EVENT_TONE[event.kind] || "slate"}">${icon(EVENT_ICON[event.kind] || "dot", 11)}</span></div>
                <div class="timeline-main">
                  <b>${esc(event.title)}</b>
                  <p>${esc(event.detail)}</p>
                  <div class="run-event-meta">${event.meta ? `<span>${esc(event.meta)}</span>` : ""}<span>${esc(relative(event.t))}</span></div>
                </div>
                <div class="timeline-meta"></div>
              </div>`,
            )
            .join("")}</div></div>`,
          flush: false,
        })}
        ${item.status === "failed" ? `<div class="failure-box"><b>${icon("alert", 12)} Operation failed</b><p>${esc(item.failure || "The operation ended without a result.")}</p></div>` : ""}
        ${live ? `<div class="callout tone-cyan"><div class="callout-title">${icon("pulse", 12)} Live operation</div><div class="callout-body">The run is reporting events. It has not produced evidence yet; nothing here is verified or accepted.</div></div>` : ""}
      </div>
      <div class="stack">
        ${panel({
          title: "Grant",
          iconName: "lock",
          body: `<dl class="facts">
            ${`<div class="fact"><dt>Scope</dt><dd>${esc(item.grant)}</dd></div>`}
            ${`<div class="fact"><dt>Harness</dt><dd>${esc(item.harness)}</dd></div>`}
            ${`<div class="fact"><dt>Participant</dt><dd>${esc(person(item.participantId)?.name)}</dd></div>`}
            ${`<div class="fact"><dt>Started</dt><dd>${esc(relative(item.startedAt))}</dd></div>`}
          </dl>
          <div class="divider"></div>
          <p class="small faint" style="line-height:1.5">The grant names the scope. It does not grant access beyond it; the adapter checks the boundary before a side effect.</p>`,
          className: "panel--quiet",
        })}
        ${panel({
          title: "Artifacts",
          iconName: "file",
          body: item.artifacts.length
            ? `<div class="artifacts">${item.artifacts.map((artifact) => `<div class="artifact">${icon("file", 12)}${esc(artifact.name)}<span>${esc(artifact.meta)}</span></div>`).join("")}</div>`
            : `<p class="small faint">No artifact has been written.</p>`,
        })}
        ${panel({
          title: "Evidence",
          iconName: "shield",
          body: item.evidence.length
            ? `<div class="evidence-list">${item.evidence.map((evidenceId) => `<div class="evidence-card"><div class="mono" style="font-size:10px">${esc(evidenceId)}</div><p class="evidence-note">Evidence attached to the linked objective.</p><a class="link small" href="#/objective/${item.objectiveId}?tab=evidence">Open evidence ${icon("chevronRight", 11)}</a></div>`).join("")}</div>`
            : `<div class="callout quiet"><div class="callout-title">${icon("alert", 12)} No evidence yet</div><div class="callout-body">A run can end without evidence. That is not a verification, and it is not an acceptance.</div></div>`,
        })}
        <a class="btn btn-secondary" href="#/objective/${item.objectiveId}" style="width:100%">${icon("arrowLeft", 13)} Open objective ${esc(parent?.id)}</a>
      </div>
    </div>
  </div>`;

  const inspector = `
    <div class="inspector-head"><span class="label">Run</span>${live ? `<span class="run-live"><i class="pulse"></i>live</span>` : statusChip(item.status)}</div>
    ${panel({
      title: "Operation",
      iconName: "runs",
      body: `<dl class="facts">
        ${`<div class="fact"><dt>Run</dt><dd>${esc(item.id)}</dd></div>`}
        ${`<div class="fact"><dt>Events</dt><dd>${item.events.length}</dd></div>`}
        ${`<div class="fact"><dt>Elapsed</dt><dd>${esc(elapsed(item.startedAt, item.endedAt))}</dd></div>`}
        ${`<div class="fact"><dt>Outcome</dt><dd>${esc(item.status)}</dd></div>`}
      </dl>`,
    })}
    ${panel({
      title: "What this proves",
      iconName: "book",
      body: `<p class="small faint" style="line-height:1.6">${live ? "An in-flight run proves only that the operation reached the executor. It has not produced evidence yet, and nothing here is verified." : item.status === "failed" ? "A failed run reports a real failure. It proves the operation did not complete, not that the direction was wrong." : "A completed run proves the operation happened. It does not prove the outcome is correct, nor that anyone accepted it. Evidence and acceptance are separate records."}</p>`,
      className: "panel--quiet",
    })}`;

  return { title: `${item.id} · neo-home`, main, inspector };
}

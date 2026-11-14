import { evidence, objectives, person, project, relative } from "../data.js";
import { avatarFor, code, emptyState, esc, icon, pageHead, panel } from "../ui.js";

export function evidenceScreen() {
  const main = `<div class="screen">
    ${pageHead({
      eyebrow: { icon: "evidence", label: "Evidence" },
      title: "What the record can support.",
      subtitle: "Each evidence record attaches a reference to one objective, by one participant. Evidence is not permission: it supports a claim and stops there.",
      actions: `<a class="btn btn-secondary" href="#/decisions">${icon("decisions", 14)} Open decisions</a>`,
    })}
    ${
      evidence.length
        ? `<div class="panel panel--flush"><div class="panel-head"><div class="panel-title">${icon("shield", 14)}Evidence records <span class="count">${evidence.length}</span></div><span class="section-action">newest first</span></div>
          ${[...evidence]
            .sort((a, b) => b.t.localeCompare(a.t))
            .map(
              (record) => `<div class="evidence-row">
                <div class="mono faint" style="font-size:9px">${esc(record.id)}</div>
                <div class="evidence-main"><b><a href="#/objective/${record.objectiveId}">${esc(objectives.find((item) => item.id === record.objectiveId)?.title || record.objectiveId)}</a></b><span>${esc(project(objectives.find((item) => item.id === record.objectiveId)?.projectId)?.name || "")} · ${esc(record.note)}</span></div>
                <div class="evidence-refs">${record.refs.map((ref) => code(ref)).join("")}</div>
                <div class="evidence-verifier">${avatarFor(record.byId, 18)} ${esc(person(record.byId)?.name || record.byId)}</div>
                <div class="evidence-when">${esc(relative(record.t))}</div>
              </div>`,
            )
            .join("")}
        </div>`
        : emptyState({ iconName: "shield", title: "No evidence recorded", body: "Evidence appears when a participant attaches a reference to a claimed objective." })
    }
  </div>`;

  const inspector = `
    <div class="inspector-head"><span class="label">Evidence</span><span class="status tone-green"><i class="dot"></i>${evidence.length} records</span></div>
    ${panel({
      title: "What evidence is",
      iconName: "shield",
      body: `<p class="small muted" style="line-height:1.6">A reference to something that was observed or demonstrated: a commit, a test, a path, a URL, a run artifact. It supports a claim; it does not grant permission to act on it.</p>
      <div class="divider"></div>
      <dl class="facts">
        <div class="fact"><dt>Records</dt><dd>${evidence.length}</dd></div>
        <div class="fact"><dt>Objectives</dt><dd>${new Set(evidence.map((record) => record.objectiveId)).size}</dd></div>
        <div class="fact"><dt>Verifiers</dt><dd>${new Set(evidence.map((record) => record.byId)).size}</dd></div>
        <div class="fact"><dt>Latest</dt><dd>${esc(relative(evidence[0]?.t))}</dd></div>
      </dl>`,
    })}
    ${panel({
      title: "A claim is not a clear",
      iconName: "alert",
      body: `<p class="small faint" style="line-height:1.55">A model narrating its own success is not evidence. Neither is activity. The surface distinguishes a claim, a run, a verification and an acceptance.</p>`,
      className: "panel--quiet",
    })}`;

  return { title: "Evidence · neo-home", main, inspector };
}

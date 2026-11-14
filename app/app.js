(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);
  const md = (value) => esc(value).replace(/`([^`]+)`/g, "<code>$1</code>");

  const STATUS = {
    open: { label: "OPEN", rgb: [0.56, 0.7, 0.8] },
    claimed: { label: "CLAIMED", rgb: [0.3, 0.76, 1] },
    verified: { label: "VERIFIED", rgb: [0.29, 0.89, 0.56] },
    accepted: { label: "ACCEPTED", rgb: [1, 0.81, 0.35] },
    blocked: { label: "BLOCKED", rgb: [1, 0.18, 0.36] },
    parked: { label: "PARKED", rgb: [0.69, 0.48, 1] },
    rejected: { label: "REJECTED", rgb: [1, 0.48, 0.56] },
  };

  const GROUPS = [
    ["NEEDS YOU", "needs", (q) => q.status === "verified"],
    ["IN PROGRESS", "", (q) => q.status === "claimed"],
    ["OPEN", "", (q) => q.status === "open"],
    ["PARKED", "parked", (q) => q.status === "parked"],
    ["BLOCKED", "blocked", (q) => q.status === "blocked"],
    ["ACCEPTED", "", (q) => q.status === "accepted"],
    ["REJECTED", "", (q) => q.status === "rejected"],
  ];

  let data = null;
  let me = null;
  let projectId = null;
  let sel = null;
  let demo = false;
  let setupMode = null;

  // ───────────────────────────── API ─────────────────────────────
  async function api(path, options = {}) {
    const response = await fetch(path, { cache: "no-store", ...options });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `request failed (${response.status})`);
    return body;
  }

  async function send(event, actor = me?.id) {
    try {
      const result = await api("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor, event }),
      });
      data = result.state;
      if (event.kind === "project.created") {
        projectId = result.event.projectId;
        sel = pickSelection();
      }
      if (event.kind === "objective.opened") sel = result.event.objectiveId;
      if (window.Void) Void.surge(0.45);
      render();
      return result.event;
    } catch (error) {
      toast(error.message);
      return null;
    }
  }

  function toast(message) {
    const node = document.createElement("div");
    node.className = "toast win";
    node.innerHTML = `<b>Store refused</b><p>${esc(message)}</p>`;
    $("#toasts").append(node);
    setTimeout(() => node.remove(), 6000);
  }

  // ───────────────────────────── boot ─────────────────────────────
  async function boot() {
    try {
      data = await api("/api/state");
      demo = Boolean(data.demo);
      const stored = localStorage.getItem("neo-home.actor");
      me =
        data.participants.find((participant) => participant.id === stored) ||
        data.participants.find((participant) => participant.kind === "human") ||
        data.participants[0] ||
        null;
      if (me) localStorage.setItem("neo-home.actor", me.id);
      projectId = data.projects[0]?.id ?? null;
      sel = pickSelection();
      render();
      if (!data.workspace) openSetup("first");
      else if (!data.participants.length) openSetup("identity");
    } catch (error) {
      $("#stage").innerHTML = `<div class="empty"><span class="tag">Store</span><h2>Cannot read the record</h2><p>${esc(error.message)}. Start the server with <code>npm start</code>.</p></div>`;
    }
  }

  function projectObjectives() {
    const list = data?.objectives ?? [];
    return projectId ? list.filter((objective) => objective.projectId === projectId) : list;
  }

  function pickSelection() {
    const list = projectObjectives();
    if (!list.length) return null;
    if (sel && list.some((objective) => objective.id === sel)) return sel;
    const priority = { verified: 0, claimed: 1, open: 2, blocked: 3, parked: 4, accepted: 5, rejected: 6 };
    return list.slice().sort((a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9))[0].id;
  }

  function selected() {
    return (data?.objectives ?? []).find((objective) => objective.id === sel) ?? null;
  }

  function project() {
    return (data?.projects ?? []).find((item) => item.id === projectId) ?? null;
  }

  // ───────────────────────────── render ─────────────────────────────
  function render() {
    if (!data) return;
    hud();
    rail();
    stage();
    side();
    log();
  }

  function hud() {
    const current = project();
    const head = data.integrity.head ? data.integrity.head.slice(7, 17) : "empty";
    $("#hud").className = "hud win";
    $("#hud").innerHTML = `
      <div class="brand">NEO-HOME<small>SYSTEM · EXOS</small></div>
      <div class="position">
        <h1>${esc(current?.name || data.workspace?.name || "neo-home")}</h1>
        <p><b>${esc(data.workspace?.name || "no workspace")}</b>${current ? ` · ${esc(current.purpose || "no purpose recorded")}` : " · no project open"}</p>
      </div>
      <div class="facts">
        ${demo ? `<span class="badge-demo">ILLUSTRATIVE</span>` : ""}
        <div class="fact env"><span>ENVIRONMENT</span><b>LOCAL</b></div>
        <div class="fact identity"><span>VIEWING AS</span><b>${identitySelect()}</b></div>
        <div class="fact role"><span>ROLE</span><b>${esc(me?.role || "—")}</b></div>
        <div class="fact ledger"><span>LEDGER</span><b>${data.integrity.events} EVENTS · ${head}</b></div>
      </div>`;
    const select = $("#who");
    if (select) {
      select.onchange = () => {
        me = data.participants.find((participant) => participant.id === select.value) || null;
        if (me) localStorage.setItem("neo-home.actor", me.id);
        render();
      };
    }
  }

  function identitySelect() {
    if (!data.participants.length) return `<span class="hint">no participant</span>`;
    return `<select id="who" aria-label="Viewing as">${data.participants
      .map(
        (participant) =>
          `<option value="${esc(participant.id)}"${participant.id === me?.id ? " selected" : ""}>${esc(participant.name)} · ${participant.kind}</option>`,
      )
      .join("")}</select>`;
  }

  function rail() {
    const list = projectObjectives();
    const current = project();
    $("#rail").className = "rail win";
    $("#rail").innerHTML = `
      <div class="projhead">
        <span class="tag">Project</span>
        <h2>${esc(current?.name || "No project")}</h2>
        <p>${esc(current?.purpose || "Open a project to group continuing objectives.")}</p>
        ${data.projects.length > 1 ? `<select id="proj" aria-label="Project">${data.projects
          .map((item) => `<option value="${esc(item.id)}"${item.id === projectId ? " selected" : ""}>${esc(item.name)}</option>`)
          .join("")}</select>` : ""}
        <button class="btn quiet" id="add-project" style="margin-top:9px;width:100%;min-height:34px;font-size:10px">＋ Project</button>
      </div>
      <div class="olist">
        ${
          list.length
            ? GROUPS.map(([label, cls, test]) => {
                const group = list.filter(test);
                if (!group.length) return "";
                return `<div class="grp ${cls}"><span>${label}</span><span>${group.length}</span></div>${group
                  .map(
                    (objective) => `
                  <button class="obj" data-id="${esc(objective.id)}" data-status="${objective.status}" aria-current="${objective.id === sel}">
                    <i class="dot"></i>
                    <span><h3>${esc(objective.title)}</h3><small>${esc(objective.id)}${objective.owner ? ` · ${esc(ownerName(objective.owner))}` : ""} · ${ago(objective.updatedAt)}</small></span>
                    <span class="st">${STATUS[objective.status]?.label || objective.status}</span>
                  </button>`,
                  )
                  .join("")}`;
              }).join("")
            : `<div class="empty-note"><b>NO OBJECTIVES</b>This project has no work recorded yet.</div>`
        }
        <button class="btn quiet" id="add-objective" style="margin:14px 10px 4px;width:calc(100% - 20px);min-height:36px;font-size:10px">＋ Objective</button>
      </div>`;
    const proj = $("#proj");
    if (proj) {
      proj.onchange = () => {
        projectId = proj.value;
        sel = pickSelection();
        render();
      };
    }
    $("#rail").querySelectorAll(".obj").forEach((button) => {
      button.onclick = () => select(button.dataset.id);
    });
    $("#add-project").onclick = addProject;
    $("#add-objective").onclick = addObjective;
  }

  function stage() {
    const objective = selected();
    if (!objective) {
      $("#stage").innerHTML = `<div class="empty">
        <span class="tag">Objective</span>
        <h2>${projectObjectives().length ? "Nothing selected" : "No objectives yet"}</h2>
        <p>${projectObjectives().length
          ? "Choose an objective from the left to see its intent, contributions, evidence, and available actions."
          : "An objective records a direction, who authorized it, and the conditions under which it is done."}</p>
        <div class="acts"><button class="btn" id="empty-add">Open an objective</button></div>
      </div>`;
      $("#empty-add").onclick = addObjective;
      return;
    }

    const status = STATUS[objective.status] || { label: objective.status.toUpperCase() };
    const current = data.projects.find((item) => item.id === objective.projectId);
    $("#stage").innerHTML = `
      <section class="sys win" data-status="${objective.status}" aria-labelledby="title">
        <div class="edge"></div>
        <div class="top">
          <span class="tag">Objective · ${esc(current?.name || "project")}</span>
          <span style="display:flex;gap:8px;align-items:center">
            ${demo ? `<span class="illus">illustrative</span>` : ""}
            <span class="chip"><i class="dot"></i>${esc(status.label)}</span>
          </span>
        </div>
        <h2 id="title">${esc(objective.title)}</h2>
        <p class="brief">${md(objective.intent)}</p>
        <div class="meta">
          <span>ID <b>${esc(objective.id)}</b></span>
          <span>AUTHORITY <b>${esc(objective.authority)}</b></span>
          <span>OWNER <b>${esc(objective.owner ? ownerName(objective.owner) : "nobody")}</b></span>
          <span>UPDATED <b>${esc(ago(objective.updatedAt))}</b></span>
        </div>
        <div class="cols">
          <div>
            <p class="sub">DONE WHEN</p>
            ${objective.conditions.length
              ? `<ul class="conds">${objective.conditions.map((condition) => `<li>${md(condition)}</li>`).join("")}</ul>`
              : `<p class="hint">No conditions recorded. A condition is how the outcome can be judged.</p>`}
          </div>
          <div>
            <p class="sub">EVIDENCE</p>
            <div class="evbox">
              ${
                objective.evidence.length
                  ? objective.evidence
                      .map(
                        (evidence) => `
                    ${evidence.refs.map((ref) => `<span class="ref">§ ${esc(ref)}</span>`).join("")}
                    ${evidence.note ? `<p class="note">${md(evidence.note)}</p>` : ""}
                    <p class="who">VERIFIED BY ${esc(ownerName(evidence.by))} · ${esc(ago(evidence.t))}</p>`,
                      )
                      .join("")
                  : `<p class="note" style="margin:0;color:var(--ink-3)">No evidence attached. A claim is not a verification.</p>`
              }
            </div>
          </div>
        </div>
        ${notice(objective)}
        ${contributions(objective)}
        <div class="exbar"><i class="lamp"></i><span>Executor offline · no adapter connected · running cannot be reported</span></div>
        <div class="acts">${actions(objective)}</div>
      </section>`;
    wireStage(objective);
  }

  function notice(objective) {
    switch (objective.status) {
      case "open":
        return `<div class="notice"><b>OPEN</b>No one owns this yet. Claiming records ownership; it does not record completion.</div>`;
      case "claimed":
        return `<div class="notice warn"><b>CLAIMED · NOT COMPLETE</b>${esc(ownerName(objective.owner))} owns this. Verification needs evidence and a participant other than the owner.</div>`;
      case "verified":
        return `<div class="notice good"><b>VERIFIED · NOT ACCEPTED</b>Evidence supports the outcome. A person with authority still has to accept it.</div>`;
      case "accepted":
        return `<div class="notice good"><b>ACCEPTED</b>${esc(ownerName(objective.decision?.by))} decided.${objective.decision?.note ? ` ${md(objective.decision.note)}` : ""}</div>`;
      case "blocked":
        return `<div class="notice bad"><b>BLOCKED</b>${esc(objective.block?.reason || "No reason recorded.")}</div>`;
      case "parked":
        return `<div class="notice warn"><b>PARKED</b>Reopens when: ${esc(objective.park?.condition || "no condition recorded.")}</div>`;
      case "rejected":
        return `<div class="notice bad"><b>REJECTED</b>${esc(objective.rejection?.reason || "No reason recorded.")}</div>`;
      default:
        return "";
    }
  }

  function contributions(objective) {
    if (!objective.contributions.length) return "";
    return `<div class="contributor"><p class="sub">CONTRIBUTIONS</p>${objective.contributions
      .map(
        (contribution) => `
      <div class="contrib">
        <span class="k" data-k="${esc(contribution.kind)}">${esc(contribution.kind)}</span>
        <div>
          <p>${md(contribution.body)}</p>
          ${contribution.refs.length ? `<p class="by">${contribution.refs.map((ref) => esc(ref)).join(" · ")}</p>` : ""}
          <p class="by">${esc(ownerName(contribution.author))} · ${esc(ago(contribution.t))}</p>
        </div>
      </div>`,
      )
      .join("")}</div>`;
  }

  function actions(objective) {
    if (!me) return `<span class="hint">No participant is selected. Add one from the right panel.</span>`;
    const items = [];
    const isOwner = objective.owner === me.id;
    if (objective.status === "open") {
      items.push(`<button class="btn" data-act="claim">Claim</button>`);
    }
    if (objective.status === "claimed") {
      items.push(
        `<button class="btn" data-act="verify"${isOwner ? " disabled" : ""}>Attach evidence &amp; verify</button>`,
      );
    }
    if (objective.status === "verified") {
      items.push(
        `<button class="btn warn" data-act="accept"${me.kind !== "human" ? " disabled" : ""}>Accept</button>`,
      );
    }
    if (["open", "claimed", "verified"].includes(objective.status)) {
      items.push(`<button class="btn ghost" data-act="propose">Propose</button>`);
    }
    if (["open", "claimed"].includes(objective.status)) {
      items.push(`<button class="btn quiet" data-act="park">Park</button>`);
      items.push(`<button class="btn quiet" data-act="revise">Revise intent</button>`);
    }
    if (["open", "claimed", "verified"].includes(objective.status)) {
      items.push(`<button class="btn quiet" data-act="block">Block</button>`);
      items.push(`<button class="btn quiet" data-act="reject">Reject</button>`);
    }
    if (["blocked", "parked", "rejected"].includes(objective.status)) {
      items.push(`<button class="btn" data-act="reopen">Reopen</button>`);
    }
    if (objective.status === "claimed" && isOwner) {
      items.push(`<span class="hint">You own this objective; another participant must verify it.</span>`);
    }
    if (objective.status === "verified" && me.kind !== "human") {
      items.push(`<span class="hint">Only a person can accept.</span>`);
    }
    if (objective.status === "accepted") {
      items.push(`<span class="hint">Settled. To revisit the direction, open a new objective and reference this one.</span>`);
    }
    if (objective.status === "rejected") {
      items.push(`<span class="hint">Reopen records what changed; the rejection stays in the log.</span>`);
    }
    return items.join("");
  }

  function wireStage(objective) {
    $("#stage").querySelectorAll("[data-act]").forEach((button) => {
      button.onclick = () => runAction(button.dataset.act, objective);
    });
    if (window.Void) Void.tint(statusTint(objective.status));
  }

  // Keep the surface midnight-blue; standing only shifts the hue.
  function statusTint(status) {
    const base = [0.25, 0.62, 1.0];
    const accent = STATUS[status]?.rgb || base;
    return base.map((value, index) => value * 0.74 + accent[index] * 0.26);
  }

  function side() {
    const operations = (data.objectives || []).reduce((sum, objective) => sum + (objective.operations?.length || 0), 0);
    $("#side").innerHTML = `
      <section class="win participants">
        <span class="tag">Participants</span>
        <div style="margin-top:8px">
          ${data.participants
            .map(
              (participant) => `
            <div class="mem${participant.id === me?.id ? " me" : ""}">
              <span class="av">${esc(participant.name.slice(0, 1).toUpperCase())}</span>
              <div>
                <h4>${esc(participant.name)} <span>${participant.kind.toUpperCase()}${participant.id === me?.id ? " · YOU" : ""}</span></h4>
                <p>${esc(participant.role || "no role")}${participant.owns ? ` · <em>owns ${participant.owns}</em>` : ""} · verified ${participant.verified}</p>
              </div>
            </div>`,
            )
            .join("")}
        </div>
        <button class="btn quiet" id="add-participant" style="margin-top:12px;width:100%;min-height:34px;font-size:10px">＋ Participant</button>
      </section>
      <section class="win">
        <span class="tag">Execution</span>
        <div class="exoff" style="margin-top:10px"><i class="lamp"></i><div><b>OFFLINE</b><br><span>No adapter is connected. This build cannot report a running state.</span></div></div>
        <div class="row"><span>OPERATIONS</span><b>${operations}</b></div>
      </section>
      <section class="win">
        <span class="tag">Integrity</span>
        <div class="row"><span>CHAIN</span><b class="ok">VERIFIED</b></div>
        <div class="row"><span>EVENTS</span><b>${data.integrity.events}</b></div>
        <div class="row"><span>HEAD</span><b>${esc((data.integrity.head || "empty").slice(7, 16) || "empty")}</b></div>
        <div class="legend">
          <div><b>Claimed</b><span>someone owns it</span></div>
          <div><b>Running</b><span>an executor reported it — not connected here</span></div>
          <div><b>Verified</b><span>evidence supports the outcome</span></div>
          <div><b>Accepted</b><span>a person with authority decided</span></div>
        </div>
      </section>`;
    $("#add-participant").onclick = addParticipant;
  }

  function log() {
    const items = (data.log || []).slice().reverse().slice(0, 16);
    $("#log").className = "log win";
    $("#log").innerHTML = `<span class="tag">Activity</span><ol>${
      items.length
        ? items.map((event) => `<li>${esc(event.summary)}<span class="hint"> · ${esc(ago(event.t))}</span></li>`).join("")
        : `<li>No activity recorded.</li>`
    }</ol>`;
  }

  // ───────────────────────────── actions ─────────────────────────────
  function runAction(action, objective) {
    switch (action) {
      case "claim":
        return dialog({
          title: "Claim this objective",
          subtitle: `Ownership moves to ${me.name}. It records who is responsible, not that the work is done.`,
          submit: "Claim",
          fields: [],
          onSubmit: () =>
            send({ kind: "objective.claimed", objectiveId: objective.id, by: me.id, from: objective.status }),
        });
      case "verify":
        return dialog({
          title: "Attach evidence",
          subtitle: "At least one reference is required. Evidence supports a claim; it does not grant permission to act.",
          submit: "Verify",
          fields: [
            { name: "refs", label: "Evidence references · one per line", type: "textarea", placeholder: "commit:abc123\npath:src/index.ts\ntest:store" },
            { name: "note", label: "What the evidence shows", type: "textarea", placeholder: "Both rules fail closed." },
          ],
          onSubmit: ({ refs, note }) => {
            const list = refs.split(/\n+/).map((line) => line.trim()).filter(Boolean);
            if (!list.length) return toast("At least one reference is required.");
            return send({ kind: "objective.verified", objectiveId: objective.id, by: me.id, from: objective.status, refs: list, note });
          },
        });
      case "accept":
        return dialog({
          title: "Accept this objective",
          subtitle: "Acceptance records that a person with authority decided. It does not turn evidence into permission for anything else.",
          submit: "Accept",
          fields: [{ name: "note", label: "Decision note", type: "textarea", placeholder: "Accepted." }],
          onSubmit: ({ note }) =>
            send({ kind: "objective.accepted", objectiveId: objective.id, by: me.id, from: objective.status, note }),
        });
      case "propose":
        return dialog({
          title: "Add a contribution",
          subtitle: "A proposal adds a possibility. A commitment records a decision. An observation records what was seen.",
          submit: "Add",
          fields: [
            { name: "contributionKind", label: "Kind", type: "select", options: ["proposal", "commitment", "observation"] },
            { name: "body", label: "Contribution", type: "textarea", placeholder: "What are you adding?" },
            { name: "refs", label: "References · optional, one per line", type: "textarea", placeholder: "path:src/index.ts" },
          ],
          onSubmit: ({ contributionKind, body, refs }) => {
            if (!body.trim()) return toast("A contribution needs a body.");
            return send({
              kind: "contribution.added",
              objectiveId: objective.id,
              author: me.id,
              contributionKind,
              body,
              refs: refs.split(/\n+/).map((line) => line.trim()).filter(Boolean),
            });
          },
        });
      case "block":
        return dialog({
          title: "Block this objective",
          subtitle: "A block names what prevents progress. It stays visible until someone reopens it with a reason.",
          submit: "Block",
          fields: [{ name: "reason", label: "Reason", type: "textarea", placeholder: "The host is not provisioned." }],
          onSubmit: ({ reason }) => {
            if (!reason.trim()) return toast("A block needs a reason.");
            return send({ kind: "objective.blocked", objectiveId: objective.id, by: me.id, from: objective.status, reason });
          },
        });
      case "park":
        return dialog({
          title: "Park this objective",
          subtitle: "Parking keeps an alternative with the condition that would reopen it.",
          submit: "Park",
          fields: [{ name: "condition", label: "Reopen when", type: "textarea", placeholder: "The alias table is exported." }],
          onSubmit: ({ condition }) => {
            if (!condition.trim()) return toast("Parking needs a reopening condition.");
            return send({ kind: "objective.parked", objectiveId: objective.id, by: me.id, from: objective.status, condition });
          },
        });
      case "reject":
        return dialog({
          title: "Reject this objective",
          subtitle: "A rejection keeps its reason so the path does not resurface unexplained.",
          submit: "Reject",
          fields: [{ name: "reason", label: "Reason", type: "textarea", placeholder: "Out of scope for this project." }],
          onSubmit: ({ reason }) => {
            if (!reason.trim()) return toast("A rejection needs a reason.");
            return send({ kind: "objective.rejected", objectiveId: objective.id, by: me.id, from: objective.status, reason });
          },
        });
      case "reopen":
        return dialog({
          title: "Reopen this objective",
          subtitle: "The prior standing is kept in the log. The objective returns to open and must be claimed again.",
          submit: "Reopen",
          fields: [{ name: "reason", label: "What changed", type: "textarea", placeholder: "The host is provisioned." }],
          onSubmit: ({ reason }) => {
            if (!reason.trim()) return toast("A reopen needs a reason.");
            return send({ kind: "objective.reopened", objectiveId: objective.id, by: me.id, from: objective.status, reason });
          },
        });
      case "revise":
        return dialog({
          title: "Revise the intent",
          subtitle: "A revision announces itself in the log and names the work it affects.",
          submit: "Revise",
          fields: [{ name: "intent", label: "New intent", type: "textarea", value: objective.intent }],
          onSubmit: ({ intent }) => {
            if (!intent.trim()) return toast("A revision needs the new intent.");
            return send({ kind: "objective.revised", objectiveId: objective.id, by: me.id, from: objective.status, intent });
          },
        });
      default:
        return null;
    }
  }

  function addParticipant() {
    dialog({
      title: "Add a participant",
      subtitle: "A participant can author contributions. A person can accept; an agent cannot.",
      submit: "Register",
      fields: [
        { name: "name", label: "Name", type: "text", placeholder: "Ivo" },
        { name: "participantKind", label: "Kind", type: "select", options: ["human", "agent"] },
        { name: "role", label: "Role", type: "text", placeholder: "Reviewer" },
      ],
      onSubmit: async ({ name, participantKind, role }) => {
        if (!name.trim()) return toast("A participant needs a name.");
        const event = await send({ kind: "participant.registered", name, participantKind, role }, me?.id || "system");
        if (event && !me) {
          me = data.participants.find((participant) => participant.id === event.participantId) || null;
          if (me) localStorage.setItem("neo-home.actor", me.id);
          render();
        }
      },
    });
  }

  function addProject() {
    dialog({
      title: "Open a project",
      subtitle: "A project carries a continuing objective and its material.",
      submit: "Open",
      fields: [
        { name: "name", label: "Project name", type: "text", placeholder: "Ledger" },
        { name: "purpose", label: "Purpose", type: "textarea", placeholder: "Keep the record honest while the surface changes." },
      ],
      onSubmit: async ({ name, purpose }) => {
        if (!name.trim()) return toast("A project needs a name.");
        if (!me) return toast("Add a participant before opening a project.");
        await send({ kind: "project.created", name, purpose }, me.id);
      },
    });
  }

  function addObjective() {
    if (!me) return toast("Add a participant before opening an objective.");
    if (!data.projects.length) return toast("Open a project before adding an objective.");
    dialog({
      title: "Open an objective",
      subtitle: "An objective records a direction, its authority, and the conditions under which it is done.",
      submit: "Open",
      fields: [
        {
          name: "projectId",
          label: "Project",
          type: "select",
          options: data.projects.map((item) => item.id),
          labels: Object.fromEntries(data.projects.map((item) => [item.id, item.name])),
          value: projectId,
        },
        { name: "title", label: "Title", type: "text", placeholder: "Index the field notes" },
        { name: "intent", label: "Intent", type: "textarea", placeholder: "Every note is findable without moving the originals." },
        { name: "conditions", label: "Done when · one per line", type: "textarea", placeholder: "All 214 notes appear\nOriginals are untouched" },
        { name: "authority", label: "Authority", type: "text", value: me.name },
      ],
      onSubmit: async (values) => {
        if (!values.title.trim() || !values.intent.trim()) return toast("An objective needs a title and an intent.");
        await send(
          {
            kind: "objective.opened",
            projectId: values.projectId,
            title: values.title,
            intent: values.intent,
            conditions: values.conditions.split(/\n+/).map((line) => line.trim()).filter(Boolean),
            authority: values.authority || me.name,
          },
          me.id,
        );
      },
    });
  }

  // ───────────────────────────── setup ─────────────────────────────
  function openSetup(mode) {
    setupMode = mode;
    const hasWorkspace = Boolean(data?.workspace);
    const hasParticipants = Boolean(data?.participants?.length);
    $("#setup").hidden = false;
    $("#setup").innerHTML = `
      <div class="panel win">
        <span class="tag">neo-home · first run</span>
        <h1>${mode === "identity" ? "Who is here?" : "A place to arrive"}</h1>
        <p class="lede">${mode === "identity"
          ? "The workspace exists. Name the person who will operate it."
          : "Name the workspace, yourself, and one project. The first objective is optional; you can open it after arriving."}</p>
        <form id="setup-form">
          ${!hasWorkspace ? `<div class="two"><div class="field"><label>Workspace</label><input name="workspace" placeholder="Home" required autocomplete="off"></div>
          <div class="field"><label>Your name</label><input name="operator" placeholder="Your name" required autocomplete="off"></div></div>` : ""}
          ${hasWorkspace && !hasParticipants ? `<div class="field"><label>Your name</label><input name="operator" placeholder="Your name" required autocomplete="off"></div>` : ""}
          ${!hasWorkspace ? `<div class="field"><label>First project</label><input name="project" placeholder="Field notes" required autocomplete="off"></div>
          <div class="field"><label>Purpose · optional</label><textarea name="purpose" placeholder="What this project keeps together."></textarea></div>
          <div class="two"><div class="field"><label>First objective · optional</label><input name="title" placeholder="Index the field notes" autocomplete="off"></div>
          <div class="field"><label>Done when · optional</label><input name="condition" placeholder="One condition" autocomplete="off"></div></div>
          <div class="field"><label>Intent · optional</label><textarea name="intent" placeholder="What the objective must make true."></textarea></div>` : ""}
          <div class="acts"><button class="btn" type="submit">Enter</button><span class="hint">Everything is stored locally. No account, no network.</span></div>
        </form>
      </div>`;
    $("#setup-form").onsubmit = async (event) => {
      event.preventDefault();
      const form = new FormData(event.target);
      const workspace = String(form.get("workspace") || "").trim();
      const operator = String(form.get("operator") || "").trim();
      if (operator && !hasParticipants) {
        const registered = await send(
          { kind: "participant.registered", name: operator, participantKind: "human", role: "Operator" },
          "system",
        );
        if (registered) {
          me = data.participants.find((participant) => participant.id === registered.participantId) || null;
          if (me) localStorage.setItem("neo-home.actor", me.id);
        }
      }
      if (!hasWorkspace) {
        if (!workspace || !operator) return toast("A workspace and your name are required.");
        await send({ kind: "workspace.created", name: workspace }, "system");
        // The identity above may have been written before the workspace, which is
        // allowed; if the participant write was refused, retry after the workspace.
        if (!me) {
          const registered = await send(
            { kind: "participant.registered", name: operator, participantKind: "human", role: "Operator" },
            "system",
          );
          if (registered) {
            me = data.participants.find((participant) => participant.id === registered.participantId) || null;
            if (me) localStorage.setItem("neo-home.actor", me.id);
          }
        }
        const projectName = String(form.get("project") || "").trim();
        if (projectName && me) {
          const project = await send(
            { kind: "project.created", name: projectName, purpose: String(form.get("purpose") || "").trim() },
            me.id,
          );
          if (project) {
            projectId = project.projectId;
            const title = String(form.get("title") || "").trim();
            const intent = String(form.get("intent") || "").trim();
            if (title && intent) {
              await send(
                {
                  kind: "objective.opened",
                  projectId,
                  title,
                  intent,
                  conditions: String(form.get("condition") || "").trim()
                    ? [String(form.get("condition")).trim()]
                    : [],
                  authority: me.name,
                },
                me.id,
              );
            }
          }
        }
      }
      if (!me) return toast("Add a participant before continuing.");
      sel = pickSelection();
      $("#setup").hidden = true;
      render();
    };
    $("#setup-form").querySelector("input, textarea, select")?.focus();
  }

  // ───────────────────────────── dialog ─────────────────────────────
  function dialog({ title, subtitle, fields, submit, onSubmit }) {
    const dlg = $("#dlg");
    dlg.innerHTML = `
      <form class="dlg win">
        <span class="tag">Record</span>
        <h3>${esc(title)}</h3>
        <p class="sub2">${esc(subtitle)}</p>
        ${fields.map((field) => {
          if (field.type === "select") {
            const options = field.options || [];
            return `<div class="field"><label>${esc(field.label)}</label><select name="${esc(field.name)}">${options
              .map((option) => `<option value="${esc(option)}"${option === field.value ? " selected" : ""}>${esc(field.labels?.[option] || option)}</option>`)
              .join("")}</select></div>`;
          }
          if (field.type === "textarea") {
            return `<div class="field"><label>${esc(field.label)}</label><textarea name="${esc(field.name)}" placeholder="${esc(field.placeholder || "")}">${esc(field.value || "")}</textarea></div>`;
          }
          return `<div class="field"><label>${esc(field.label)}</label><input name="${esc(field.name)}" value="${esc(field.value || "")}" placeholder="${esc(field.placeholder || "")}" autocomplete="off"></div>`;
        }).join("")}
        <div class="acts"><button class="btn" type="submit">${esc(submit)}</button><button class="btn quiet" type="button" id="cancel">Cancel</button></div>
      </form>`;
    $("#cancel").onclick = () => dlg.close();
    dlg.querySelector("form").onsubmit = async (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.target).entries());
      dlg.close();
      await onSubmit(values);
    };
    dlg.showModal();
    dlg.querySelector("input, textarea, select")?.focus();
  }

  // ───────────────────────────── selection & time ─────────────────────────────
  function select(id) {
    const change = () => {
      sel = id;
      render();
    };
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.startViewTransition(change);
    } else {
      change();
    }
  }

  function ownerName(id) {
    return data?.participants?.find((participant) => participant.id === id)?.name || id || "nobody";
  }

  function ago(iso) {
    if (!iso) return "—";
    const seconds = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
    return `${Math.round(seconds / 86400)}d ago`;
  }


  addEventListener("keydown", (event) => {
    if (event.target.closest("input, textarea, select, dialog")) return;
    const controls = [...document.querySelectorAll(".obj")];
    const index = controls.findIndex((control) => control.dataset.id === sel);
    if (event.key === "ArrowDown" || event.key === "j") {
      event.preventDefault();
      const next = controls[Math.min(controls.length - 1, index + 1)];
      if (next) select(next.dataset.id);
    }
    if (event.key === "ArrowUp" || event.key === "k") {
      event.preventDefault();
      const previous = controls[Math.max(0, index - 1)];
      if (previous) select(previous.dataset.id);
    }
  });

  setInterval(async () => {
    if (setupMode && !$("#setup").hidden) return;
    if ($("#dlg").open) return;
    try {
      data = await api("/api/state");
      me = data.participants.find((participant) => participant.id === me?.id) || data.participants[0] || null;
      if (sel && !data.objectives.some((objective) => objective.id === sel)) sel = pickSelection();
      render();
    } catch {
      /* the surface keeps its last known state */
    }
  }, 5000);

  boot();
})();

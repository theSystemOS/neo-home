import { icon } from "./icons.js";
import { esc } from "./ui.js";

export function closeModal() {
  const root = document.getElementById("modal-root");
  if (!root) return;
  root.innerHTML = "";


}

export function openModal({ title, sub = "", fields = [], body = "", submit = "Save", onSubmit, submitTone = "primary", wide = false }) {
  const root = document.getElementById("modal-root");
  if (!root) return;
  const id = `modal-${Date.now()}`;
  root.innerHTML = `<div class="modal-backdrop" data-modal-backdrop>
    <div class="modal ${wide ? "modal--wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="${id}" style="${wide ? "width:min(680px,94vw)" : ""}">
      <div class="modal-head">
        <div>
          <h2 class="modal-title" id="${id}">${esc(title)}</h2>
          ${sub ? `<p class="modal-sub">${esc(sub)}</p>` : ""}
        </div>
        <button class="icon-btn" type="button" data-modal-close aria-label="Close">${icon("close", 16)}</button>
      </div>
      <form data-modal-form>
        ${body ? `<div class="modal-body">${body}</div>` : ""}
        ${fields.length ? `<div class="modal-body">${fields
          .map((field) => {
            if (field.type === "select") {
              return `<div class="field"><label for="${id}-${field.name}">${esc(field.label)}</label><select id="${id}-${field.name}" name="${field.name}">${(field.options || [])
                .map((option) => {
                  const value = typeof option === "string" ? option : option.value;
                  const label = typeof option === "string" ? option : option.label;
                  return `<option value="${esc(value)}"${value === field.value ? " selected" : ""}>${esc(label)}</option>`;
                })
                .join("")}</select></div>`;
            }
            if (field.type === "textarea") {
              return `<div class="field"><label for="${id}-${field.name}">${esc(field.label)}</label><textarea id="${id}-${field.name}" name="${field.name}" placeholder="${esc(field.placeholder || "")}">${esc(field.value || "")}</textarea></div>`;
            }
            return `<div class="field"><label for="${id}-${field.name}">${esc(field.label)}</label><input id="${id}-${field.name}" name="${field.name}" type="${field.type || "text"}" value="${esc(field.value || "")}" placeholder="${esc(field.placeholder || "")}" autocomplete="off"></div>`;
          })
          .join("")}</div>` : ""}
        <div class="modal-foot">
          <button class="btn btn-ghost" type="button" data-modal-close>Cancel</button>
          <button class="btn btn-${submitTone}" type="submit">${esc(submit)}</button>
        </div>
      </form>
    </div>
  </div>`;
  const backdrop = root.querySelector("[data-modal-backdrop]");
  const form = root.querySelector("[data-modal-form]");
  const close = () => closeModal();
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) close();
  });
  root.querySelectorAll("[data-modal-close]").forEach((button) => (button.onclick = close));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    const result = onSubmit ? await onSubmit(values) : undefined;
    if (result !== false) close();
  });
  const onKey = (event) => {
    if (event.key === "Escape") {
      close();
      removeEventListener("keydown", onKey);
    }
  };
  addEventListener("keydown", onKey);
  requestAnimationFrame(() => form.querySelector("input, textarea, select, button")?.focus());
}

export function toast({ title = "Prototype state", body = "", tone = "cyan" } = {}) {
  const root = document.getElementById("toast-root");
  if (!root) return;
  const node = document.createElement("div");
  node.className = `toast tone-${tone}`;
  node.innerHTML = `<b>${esc(title)}</b>${body ? `<p>${esc(body)}</p>` : ""}`;
  root.append(node);
  setTimeout(() => {
    node.style.transition = "opacity .2s, transform .2s";
    node.style.opacity = "0";
    node.style.transform = "translateY(4px)";
    setTimeout(() => node.remove(), 220);
  }, 4200);
}

export function prototypeToast(action) {
  toast({
    title: "Prototype updated",
    body: `${action}. No record was written; this is illustrative state.`,
    tone: "gold",
  });
}

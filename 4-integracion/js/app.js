import { BasicPlan } from "./plans/BasicPlan.js";
import { PlanBuilder, PlanBuildError } from "./builder/PlanBuilder.js";
import { SEGMENTS, DEFAULT_SEGMENT_ID, createSegment } from "./abstractFactory/segments.js";
import { templateRegistry } from "./prototype/PlanTemplateRegistry.js";
import { SavedPlansStore } from "./features/SavedPlansStore.js";

const DEFAULT_BASE_ID = BasicPlan.ID;

const store = new SavedPlansStore(window.localStorage);

const state = {
  segmentId: DEFAULT_SEGMENT_ID,
  baseId: DEFAULT_BASE_ID,
  addonIds: [],
  name: "",
  built: null,
  problems: []
};

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const elements = {
  segments: document.getElementById("segments"),
  basePlans: document.getElementById("base-plans"),
  addons: document.getElementById("addons"),
  templates: document.getElementById("templates"),
  total: document.getElementById("total"),
  description: document.getElementById("description"),
  data: document.getElementById("stat-data"),
  minutes: document.getElementById("stat-minutes"),
  features: document.getElementById("features"),
  breakdown: document.getElementById("breakdown"),
  activeAddons: document.getElementById("active-addons"),
  layers: document.getElementById("layers"),
  code: document.getElementById("code"),
  errors: document.getElementById("plan-errors"),
  discount: document.getElementById("discount"),
  discountLabel: document.getElementById("discount-label"),
  priceOriginal: document.getElementById("price-original"),
  priceDiscount: document.getElementById("price-discount"),
  priceFinal: document.getElementById("price-final"),
  planName: document.getElementById("plan-name"),
  save: document.getElementById("save-plan"),
  savedPlans: document.getElementById("saved-plans"),
  savedStatus: document.getElementById("saved-status"),
  reset: document.getElementById("reset")
};

function currentSegment() {
  return createSegment(state.segmentId);
}

function countAddon(id) {
  return state.addonIds.filter((addonId) => addonId === id).length;
}

function formatMinutes(minutes) {
  return Number.isFinite(minutes) ? `${minutes} min` : "Ilimitados";
}

function formatServices(total) {
  return `${total} ${total === 1 ? "servicio" : "servicios"}`;
}

function escapeHtml(value) {
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value).replace(/[&<>"']/g, (char) => entities[char]);
}

function setStatus(message) {
  elements.savedStatus.textContent = message;
}

/** Loads a selection, keeping only what the current segment actually offers. */
function applySelection({ segmentId = null, baseId, addonIds = [], name = null }) {
  if (segmentId) {
    state.segmentId = segmentId;
  }

  const segment = currentSegment();
  state.baseId = segment.offersPlan(baseId) ? baseId : segment.createPlanCatalog()[0].ID;
  state.addonIds = addonIds.filter((id) => segment.offersAddon(id));

  if (name !== null) {
    state.name = name;
    elements.planName.value = name;
  }
}

function updateBuild() {
  try {
    state.built = new PlanBuilder()
      .base(state.baseId)
      .addons(state.addonIds)
      .named(state.name)
      .build();
    state.problems = [];
  } catch (error) {
    state.problems = error instanceof PlanBuildError ? error.problems : [error.message];
  }
}

function renderSegments() {
  elements.segments.innerHTML = SEGMENTS.map((Factory) => {
    const selected = Factory.ID === state.segmentId;
    return `
      <button type="button" class="segment ${selected ? "is-selected" : ""}" data-segment="${Factory.ID}" aria-pressed="${selected}">
        <span class="segment__name">${Factory.LABEL}</span>
        <span class="segment__description">${Factory.DESCRIPTION}</span>
      </button>`;
  }).join("");
}

function renderBasePlans() {
  elements.basePlans.innerHTML = currentSegment()
    .createPlanCatalog()
    .map((Plan) => {
      const plan = new Plan();
      const selected = Plan.ID === state.baseId;
      return `
        <button type="button" class="plan-card ${selected ? "is-selected" : ""}" data-base="${Plan.ID}" aria-pressed="${selected}">
          <span class="plan-card__name">${plan.getDescription()}</span>
          <span class="plan-card__tagline">${Plan.TAGLINE}</span>
          <span class="plan-card__price">${money.format(plan.getPrice())}<small>/mes</small></span>
          <span class="plan-card__specs">${plan.getDataGB()} GB · ${formatMinutes(plan.getMinutes())}</span>
        </button>`;
    })
    .join("");
}

function renderAddons() {
  elements.addons.innerHTML = currentSegment()
    .createAddonCatalog()
    .map((Addon) => {
      const count = countAddon(Addon.ID);
      const disabled = !Addon.STACKABLE && count > 0;
      return `
        <article class="addon ${count > 0 ? "is-active" : ""}">
          <div class="addon__icon" aria-hidden="true">${Addon.ICON}</div>
          <div class="addon__body">
            <h3>${Addon.LABEL} ${count > 1 ? `<span class="badge">x${count}</span>` : ""}</h3>
            <p>${Addon.DESCRIPTION}</p>
            <code class="addon__class">${Addon.name}</code>
          </div>
          <div class="addon__action">
            <span class="addon__price">+${money.format(Addon.COST)}</span>
            <button type="button" class="btn btn--small" data-add="${Addon.ID}" ${disabled ? "disabled" : ""}>
              ${disabled ? "Agregado" : "Agregar"}
            </button>
          </div>
        </article>`;
    })
    .join("");
}

function renderTemplates() {
  elements.templates.innerHTML = templateRegistry
    .list()
    .map((template) => {
      const Plan = createSegment(template.segmentId).createPlan(template.baseId);
      return `
        <button type="button" class="template" data-template="${escapeHtml(template.id)}">
          <span class="template__name">${escapeHtml(template.name)}</span>
          <span class="template__detail">${Plan ? Plan.LABEL : template.baseId} · ${formatServices(template.addonIds.length)}</span>
        </button>`;
    })
    .join("");
}

function renderErrors() {
  elements.errors.hidden = state.problems.length === 0;
  elements.errors.innerHTML = state.problems.length
    ? `<h3>No pudimos armar tu plan</h3><ul>${state.problems
        .map((problem) => `<li>${escapeHtml(problem)}</li>`)
        .join("")}</ul>`
    : "";
}

function renderDiscount(plan) {
  const policy = currentSegment().createDiscountPolicy();
  const original = plan.getPrice();
  const final = policy.apply(original);

  elements.total.textContent = money.format(final);

  elements.discount.hidden = policy.rate === 0;
  if (policy.rate > 0) {
    elements.discountLabel.textContent = policy.label;
    elements.priceOriginal.textContent = money.format(original);
    elements.priceDiscount.textContent = `-${money.format(original - final)}`;
    elements.priceFinal.textContent = money.format(final);
  }
}

function renderSummary() {
  renderErrors();

  if (state.problems.length || !state.built) {
    return;
  }

  const { plan } = state.built;
  const segment = currentSegment();

  elements.description.textContent = plan.getDescription();
  elements.data.textContent = `${plan.getDataGB()} GB`;
  elements.minutes.textContent = formatMinutes(plan.getMinutes());

  renderDiscount(plan);

  elements.features.innerHTML = plan.getFeatures().map((feature) => `<li>${feature}</li>`).join("");

  elements.breakdown.innerHTML = plan.getBreakdown().map((item, index) => `
    <tr>
      <td>${index === 0 ? "Base" : `Capa ${index}`}</td>
      <td>${item.label}</td>
      <td>${index === 0 ? "" : "+"}${money.format(item.price)}</td>
    </tr>`).join("");

  elements.activeAddons.innerHTML = state.addonIds.length
    ? state.addonIds.map((id, index) => {
        const addon = segment.createAddon(id);
        const label = addon ? addon.LABEL : id;
        return `
        <li class="chip">
          <span>${index + 1}. ${label}</span>
          <button type="button" data-remove="${index}" aria-label="Quitar ${label}">×</button>
        </li>`;
      }).join("")
    : `<li class="empty">Aún no has agregado servicios. Tu plan es solo el componente base.</li>`;

  renderLayers(segment, plan);
}

function renderLayers(segment, plan) {
  const BasePlanClass = segment.createPlan(state.baseId);
  const addonClasses = state.addonIds.map((id) => segment.createAddon(id)).filter(Boolean);

  const nested = addonClasses.reduce(
    (inner, Addon) => `<div class="layer"><span class="layer__name">${Addon.name}</span>${inner}</div>`,
    `<div class="layer layer--core"><span class="layer__name">${BasePlanClass.name}</span></div>`
  );
  elements.layers.innerHTML = nested;

  const expression = addonClasses.reduce(
    (inner, Addon) => `new ${Addon.name}(${inner})`,
    `new ${BasePlanClass.name}()`
  );
  elements.code.textContent = `const plan = ${expression};\nplan.getPrice(); // ${plan.getPrice()}`;
}

function priceOf(entry) {
  try {
    const { plan } = new PlanBuilder().base(entry.baseId).addons(entry.addonIds).build();
    return money.format(plan.getPrice());
  } catch {
    return "";
  }
}

function renderSavedPlans() {
  const plans = store.list();

  elements.savedPlans.innerHTML = plans.length
    ? plans
        .map((entry) => {
          const Plan = createSegment(entry.segmentId).createPlan(entry.baseId);
          const name = Plan ? new Plan().getDescription() : entry.baseId;
          return `
          <li class="saved">
            <div class="saved__info">
              <span class="saved__name">${escapeHtml(entry.name)}</span>
              <span class="saved__detail">${name} · ${formatServices(entry.addonIds.length)} · ${priceOf(entry)}</span>
            </div>
            <div class="saved__actions">
              <button type="button" class="btn btn--tiny" data-load="${escapeHtml(entry.id)}">Cargar</button>
              <button type="button" class="btn btn--tiny" data-duplicate="${escapeHtml(entry.id)}">Duplicar</button>
              <button type="button" class="btn btn--tiny btn--danger" data-delete="${escapeHtml(entry.id)}">Borrar</button>
            </div>
          </li>`;
        })
        .join("")
    : `<li class="empty">Todavía no has guardado ningún plan.</li>`;
}

function render() {
  updateBuild();
  renderSegments();
  renderBasePlans();
  renderAddons();
  renderTemplates();
  renderSummary();
  renderSavedPlans();
}

elements.segments.addEventListener("click", (event) => {
  const button = event.target.closest("[data-segment]");
  if (!button) return;
  applySelection({
    segmentId: button.dataset.segment,
    baseId: state.baseId,
    addonIds: state.addonIds
  });
  render();
});

elements.basePlans.addEventListener("click", (event) => {
  const card = event.target.closest("[data-base]");
  if (!card) return;
  state.baseId = card.dataset.base;
  render();
});

elements.addons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (!button) return;
  state.addonIds.push(button.dataset.add);
  render();
});

elements.activeAddons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  state.addonIds.splice(Number(button.dataset.remove), 1);
  render();
});

elements.templates.addEventListener("click", (event) => {
  const button = event.target.closest("[data-template]");
  if (!button) return;
  const template = templateRegistry.get(button.dataset.template);
  if (!template) return;
  applySelection({
    segmentId: template.segmentId ?? state.segmentId,
    baseId: template.baseId,
    addonIds: template.addonIds,
    name: template.name
  });
  setStatus(`Plantilla "${template.name}" cargada.`);
  render();
});

elements.planName.addEventListener("input", (event) => {
  state.name = event.target.value;
  updateBuild();
});

elements.save.addEventListener("click", () => {
  if (state.problems.length || !state.built) {
    return;
  }
  const entry = store.save(state.built.config, { segmentId: state.segmentId });
  setStatus(`"${entry.name}" quedó guardado.`);
  renderSavedPlans();
});

elements.savedPlans.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const { load, duplicate, delete: remove } = button.dataset;

  if (load) {
    const entry = store.find(load);
    if (!entry) return;
    applySelection({
      segmentId: entry.segmentId ?? DEFAULT_SEGMENT_ID,
      baseId: entry.baseId,
      addonIds: entry.addonIds,
      name: entry.name
    });
    setStatus(`"${entry.name}" cargado en el configurador.`);
    render();
    return;
  }

  if (duplicate) {
    const entry = store.duplicate(duplicate);
    if (!entry) return;
    setStatus(`Se creó "${entry.name}".`);
    renderSavedPlans();
    return;
  }

  if (remove) {
    const entry = store.find(remove);
    if (!entry || !store.delete(remove)) return;
    setStatus(`"${entry.name}" se borró.`);
    renderSavedPlans();
  }
});

elements.reset.addEventListener("click", () => {
  state.segmentId = DEFAULT_SEGMENT_ID;
  state.baseId = DEFAULT_BASE_ID;
  state.addonIds = [];
  state.name = "";
  elements.planName.value = "";
  setStatus("");
  render();
});

render();

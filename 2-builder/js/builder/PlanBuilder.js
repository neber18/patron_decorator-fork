import { findBasePlan, findAddon } from "../catalog.js";
import { PlanConfig } from "../prototype/PlanConfig.js";

const DEFAULT_NAME = "Mi plan";

/** Collects every problem found while building instead of failing on the first one. */
export class PlanBuildError extends Error {
  constructor(problems) {
    super(`No se pudo armar el plan: ${problems.join(" ")}`);
    this.name = "PlanBuildError";
    this.problems = [...problems];
  }
}

export class PlanBuilder {
  constructor() {
    this.baseId = null;
    this.addonIds = [];
    this.name = "";
  }

  base(id) {
    this.baseId = id;
    return this;
  }

  addon(id) {
    this.addonIds.push(id);
    return this;
  }

  /** Adds a batch of addon ids on top of the ones already added. */
  addons(ids = []) {
    if (!Array.isArray(ids)) {
      throw new TypeError("addons() expects an array of ids");
    }
    this.addonIds.push(...ids);
    return this;
  }

  named(text) {
    this.name = text;
    return this;
  }

  static fromConfig(planConfig) {
    if (!planConfig || typeof planConfig !== "object") {
      throw new TypeError("fromConfig() expects a PlanConfig");
    }
    return new PlanBuilder()
      .base(planConfig.baseId)
      .addons(planConfig.addonIds ?? [])
      .named(planConfig.name);
  }

validate() {
    const problems = [];

    if (!this.baseId) {
      problems.push("Falta elegir un plan base.");
    } else if (!findBasePlan(this.baseId)) {
      problems.push(`No existe un plan base con el id "${this.baseId}".`);
    }

    const times = new Map();
    this.addonIds.forEach((id) => times.set(id, (times.get(id) ?? 0) + 1));

    times.forEach((count, id) => {
      const Addon = findAddon(id);
      if (!Addon) {
        problems.push(`No existe un servicio adicional con el id "${id}".`);
        return;
      }
      if (Addon.STACKABLE === false && count > 1) {
        problems.push(`"${Addon.LABEL}" no se puede agregar más de una vez.`);
      }
    });

    return problems;
  }

  /** Returns `{ plan, config }`: the decorated MobilePlan plus its prototype config. */
  build() {
    const problems = this.validate();
    if (problems.length) {
      throw new PlanBuildError(problems);
    }

    const BasePlanClass = findBasePlan(this.baseId);
    const plan = this.addonIds.reduce(
      (inner, addonId) => new (findAddon(addonId))(inner),
      new BasePlanClass()
    );

    const config = new PlanConfig({
      name: String(this.name ?? "").trim() || DEFAULT_NAME,
      baseId: this.baseId,
      addonIds: [...this.addonIds]
    });

    return { plan, config };
  }
}

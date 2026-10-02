import { PlanConfig } from "./PlanConfig.js";

/**
 * Prototype pattern: the registry keeps the prototypes (templates) and always
 * hands out clones, never the stored object, so editing a loaded template
 * cannot corrupt the other ones.
 */
export class PlanTemplateRegistry {
  constructor() {
    this.templates = new Map();
  }

  register(template) {
    if (!(template instanceof PlanConfig)) {
      throw new TypeError("register() only accepts PlanConfig instances");
    }
    if (!template.id) {
      throw new TypeError("A template needs an id");
    }
    if (this.templates.has(template.id)) {
      throw new Error(`A template with the id "${template.id}" is already registered`);
    }
    this.templates.set(template.id, template.clone());
    return this;
  }

  has(id) {
    return this.templates.has(id);
  }

  get(id) {
    const template = this.templates.get(id);
    return template ? template.clone() : undefined;
  }

  list() {
    return [...this.templates.values()].map((template) => template.clone());
  }
}

export const templateRegistry = new PlanTemplateRegistry();

[
  {
    id: "estudiante-conectado",
    name: "Estudiante conectado",
    baseId: "student",
    addonIds: ["extra-data", "social-media"],
    segmentId: "estudiante"
  },
  {
    id: "viajero",
    name: "Viajero",
    baseId: "basic",
    addonIds: ["roaming", "extra-data"],
    segmentId: "personal"
  },
  {
    id: "streamer",
    name: "Streamer",
    baseId: "plus",
    addonIds: ["streaming", "extra-data"],
    segmentId: "personal"
  }
].forEach((template) => templateRegistry.register(new PlanConfig(template)));

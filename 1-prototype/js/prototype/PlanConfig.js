/**
 * Prototype pattern: a plan config acts as the prototype and is cloned for
 * every use, so copies never share the addon array with the original.
 */
export class PlanConfig {
  constructor({ id = null, name, baseId, addonIds = [], segmentId = null } = {}) {
    this.id = id;
    this.name = name;
    this.baseId = baseId;
    this.addonIds = [...addonIds];
    this.segmentId = segmentId;
  }

  /** Deep copy: the addon array is duplicated, so editing a copy never touches the prototype. */
  clone() {
    return new PlanConfig({
      id: this.id,
      name: this.name,
      baseId: this.baseId,
      addonIds: [...this.addonIds],
      segmentId: this.segmentId
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      baseId: this.baseId,
      addonIds: [...this.addonIds],
      segmentId: this.segmentId
    };
  }

  static fromJSON(data) {
    return new PlanConfig(data);
  }
}

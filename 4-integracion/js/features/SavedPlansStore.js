import { PlanConfig } from "../prototype/PlanConfig.js";

export const STORAGE_KEY = "patron-decorator:mis-planes";

function createMemoryStorage() {
  const entries = new Map();
  return {
    getItem: (key) => (entries.has(key) ? entries.get(key) : null),
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: (key) => entries.delete(key)
  };
}

function normalizeStorage(storage) {
  if (storage && typeof storage.getItem === "function" && typeof storage.setItem === "function") {
    return storage;
  }
  return createMemoryStorage();
}

/**
 * Persistence layer for the plans the user saved. The storage object is
 * injected in the constructor, so it can be replaced by a fake in the tests
 * and so the site keeps working when localStorage is unavailable.
 */
export class SavedPlansStore {
  constructor(storage, { key = STORAGE_KEY } = {}) {
    this.key = key;
    this.storage = normalizeStorage(storage);
    this.sequence = 0;
  }

  list() {
    try {
      const raw = this.storage.getItem(this.key);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((entry) => ({
        ...entry,
        addonIds: Array.isArray(entry.addonIds) ? [...entry.addonIds] : []
      }));
    } catch {
      return [];
    }
  }

  save(config, { segmentId = null } = {}) {
    if (!config || typeof config !== "object") {
      throw new TypeError("save() expects a PlanConfig");
    }

    const prototype = config instanceof PlanConfig ? config.clone() : PlanConfig.fromJSON(config);
    const entry = {
      ...prototype.toJSON(),
      id: this.nextId(),
      segmentId: segmentId ?? prototype.segmentId ?? null
    };

    this.write([...this.list(), entry]);
    return entry;
  }

  find(id) {
    return this.list().find((entry) => entry.id === id);
  }

  /** Clones an entry with the name "Copia de X" and stores the copy. */
  duplicate(id) {
    const original = this.find(id);
    if (!original) {
      return undefined;
    }

    const copy = new PlanConfig({
      name: `Copia de ${original.name}`,
      baseId: original.baseId,
      addonIds: original.addonIds
    });

    return this.save(copy, { segmentId: original.segmentId });
  }

  delete(id) {
    const plans = this.list();
    const remaining = plans.filter((entry) => entry.id !== id);
    if (remaining.length === plans.length) {
      return false;
    }
    this.write(remaining);
    return true;
  }

  clear() {
    this.write([]);
  }

  write(plans) {
    try {
      this.storage.setItem(this.key, JSON.stringify(plans));
    } catch {
      // Storage full or blocked: the selection keeps working, it is just not saved.
    }
    return plans;
  }

  nextId() {
    this.sequence += 1;
    return `${Date.now().toString(36)}-${this.sequence}`;
  }
}

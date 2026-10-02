import test from "node:test";
import assert from "node:assert/strict";

import { SavedPlansStore, STORAGE_KEY } from "../js/features/SavedPlansStore.js";
import { PlanConfig } from "../js/prototype/PlanConfig.js";

/** Fake storage: same contract as window.localStorage, but empty on every test. */
function createFakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));

  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    get size() {
      return data.size;
    },
    raw: data
  };
}

function homePlan(name = "Plan de la casa") {
  return new PlanConfig({ name, baseId: "basic", addonIds: ["extra-data", "roaming"] });
}

test("save() stores the plan and list() reads it back", () => {
  const storage = createFakeStorage();
  const store = new SavedPlansStore(storage);

  const entry = store.save(homePlan(), { segmentId: "personal" });

  assert.equal(entry.name, "Plan de la casa");
  assert.equal(entry.baseId, "basic");
  assert.deepEqual(entry.addonIds, ["extra-data", "roaming"]);
  assert.equal(entry.segmentId, "personal");
  assert.ok(entry.id);

  assert.deepEqual(store.list(), [entry]);
  assert.ok(storage.getItem(STORAGE_KEY));
});

test("save() clones the config and the segment is optional", () => {
  const store = new SavedPlansStore(createFakeStorage());
  const config = homePlan();

  const entry = store.save(config);
  config.addonIds.push("streaming");
  entry.addonIds.push("streaming");

  assert.deepEqual(store.list()[0].addonIds, ["extra-data", "roaming"]);
  assert.equal(entry.segmentId, null);
});

test("save() accepts a plain object too", () => {
  const store = new SavedPlansStore(createFakeStorage());

  const entry = store.save({ name: "Simple", baseId: "student", addonIds: [] });

  assert.equal(entry.name, "Simple");
  assert.equal(store.list().length, 1);
  assert.throws(() => store.save(null), TypeError);
});

test("list() returns an empty list when there is nothing saved", () => {
  const store = new SavedPlansStore(createFakeStorage());

  assert.deepEqual(store.list(), []);
  assert.equal(store.find("nope"), undefined);
});

test("list() survives corrupted storage", () => {
  const store = new SavedPlansStore(createFakeStorage({ [STORAGE_KEY]: "{no es json" }));
  assert.deepEqual(store.list(), []);

  const notAnArray = new SavedPlansStore(createFakeStorage({ [STORAGE_KEY]: '{"a":1}' }));
  assert.deepEqual(notAnArray.list(), []);
});

test("duplicate() clones the entry as 'Copia de X'", () => {
  const store = new SavedPlansStore(createFakeStorage());
  const original = store.save(homePlan(), { segmentId: "estudiante" });

  const copy = store.duplicate(original.id);

  assert.equal(copy.name, "Copia de Plan de la casa");
  assert.equal(copy.baseId, original.baseId);
  assert.deepEqual(copy.addonIds, original.addonIds);
  assert.equal(copy.segmentId, "estudiante");
  assert.notEqual(copy.id, original.id);

  assert.equal(store.list().length, 2);
  copy.addonIds.push("streaming");
  assert.deepEqual(store.find(original.id).addonIds, ["extra-data", "roaming"]);
  assert.equal(store.duplicate("nope"), undefined);
});

test("duplicate() nests the prefix when the copy is copied again", () => {
  const store = new SavedPlansStore(createFakeStorage());
  const original = store.save(homePlan());
  const copy = store.duplicate(original.id);

  assert.equal(store.duplicate(copy.id).name, "Copia de Copia de Plan de la casa");
  assert.equal(store.list().length, 3);
});

test("delete() removes only the requested plan", () => {
  const store = new SavedPlansStore(createFakeStorage());
  const first = store.save(homePlan("Uno"));
  const second = store.save(homePlan("Dos"));

  assert.equal(store.delete(first.id), true);
  assert.deepEqual(store.list().map((entry) => entry.name), ["Dos"]);

  assert.equal(store.delete(first.id), false);
  assert.equal(store.delete(second.id), true);
  assert.deepEqual(store.list(), []);
});

test("clear() empties the storage", () => {
  const storage = createFakeStorage();
  const store = new SavedPlansStore(storage);
  store.save(homePlan());

  store.clear();

  assert.deepEqual(store.list(), []);
});

test("the plans survive in the same storage on a later visit", () => {
  const storage = createFakeStorage();
  const entry = new SavedPlansStore(storage).save(homePlan());

  const laterVisit = new SavedPlansStore(storage);

  assert.deepEqual(laterVisit.list(), [entry]);
});

test("the store falls back to memory when there is no storage", () => {
  const store = new SavedPlansStore(null);

  const entry = store.save(homePlan());

  assert.equal(store.list().length, 1);
  assert.equal(store.find(entry.id).name, "Plan de la casa");
});

test("the store keeps working when storage is blocked", () => {
  const blocked = {
    getItem: () => {
      throw new Error("SecurityError");
    },
    setItem: () => {
      throw new Error("QuotaExceededError");
    }
  };
  const store = new SavedPlansStore(blocked);

  assert.doesNotThrow(() => store.save(homePlan()));
  assert.deepEqual(store.list(), []);
});

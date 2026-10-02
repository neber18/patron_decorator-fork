import test from "node:test";
import assert from "node:assert/strict";

import { PlanConfig } from "../js/prototype/PlanConfig.js";
import { PlanTemplateRegistry, templateRegistry } from "../js/prototype/PlanTemplateRegistry.js";

test("clone() returns an independent copy of the prototype", () => {
  const prototype = new PlanConfig({
    id: "demo",
    name: "Mi plantilla",
    baseId: "basic",
    addonIds: ["extra-data"]
  });

  const copy = prototype.clone();
  copy.addonIds.push("roaming");
  copy.name = "Otra cosa";

  assert.deepEqual(prototype.addonIds, ["extra-data"]);
  assert.equal(prototype.name, "Mi plantilla");
  assert.deepEqual(copy.addonIds, ["extra-data", "roaming"]);
  assert.notEqual(prototype.addonIds, copy.addonIds);
  assert.notEqual(prototype, copy);
});

test("the constructor copies the array it receives", () => {
  const addonIds = ["extra-data"];
  const config = new PlanConfig({ name: "X", baseId: "basic", addonIds });

  addonIds.push("roaming");

  assert.deepEqual(config.addonIds, ["extra-data"]);
});

test("the registry delivers clones, never the stored template", () => {
  const registry = new PlanTemplateRegistry();
  const prototype = new PlanConfig({ id: "demo", name: "Demo", baseId: "basic", addonIds: ["extra-data"] });

  registry.register(prototype);
  prototype.addonIds.push("roaming");

  const first = registry.get("demo");
  first.addonIds.push("streaming");

  assert.deepEqual(registry.get("demo").addonIds, ["extra-data"]);
  assert.notEqual(registry.get("demo"), registry.get("demo"));
});

test("list() returns a clone for every registered template", () => {
  const registry = new PlanTemplateRegistry();
  registry.register(new PlanConfig({ id: "a", name: "A", baseId: "basic", addonIds: [] }));
  registry.register(new PlanConfig({ id: "b", name: "B", baseId: "plus", addonIds: ["roaming"] }));

  const templates = registry.list();
  templates[1].addonIds.push("extra-data");

  assert.equal(templates.length, 2);
  assert.deepEqual(registry.get("b").addonIds, ["roaming"]);
  assert.deepEqual(registry.list().map((template) => template.id), ["a", "b"]);
});

test("register() rejects duplicates and non PlanConfig values", () => {
  const registry = new PlanTemplateRegistry();
  const template = new PlanConfig({ id: "a", name: "A", baseId: "basic" });

  registry.register(template);

  assert.throws(() => registry.register(template), /already registered/);
  assert.throws(() => registry.register({ id: "c", name: "C", baseId: "basic" }), TypeError);
  assert.equal(registry.get("nope"), undefined);
});

test("the site ships three ready to use templates", () => {
  const templates = templateRegistry.list();

  assert.deepEqual(
    templates.map((template) => template.name),
    ["Estudiante conectado", "Viajero", "Streamer"]
  );

  const traveler = templateRegistry.get("viajero");
  assert.equal(traveler.baseId, "basic");
  assert.deepEqual(traveler.addonIds, ["roaming", "extra-data"]);
});

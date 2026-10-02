import test from "node:test";
import assert from "node:assert/strict";

import { PlanBuilder, PlanBuildError } from "../js/builder/PlanBuilder.js";
import { MobilePlan } from "../js/core/MobilePlan.js";
import { PlanConfig } from "../js/prototype/PlanConfig.js";

function problemsOf(fn) {
  try {
    fn();
    assert.fail("The builder should have thrown a PlanBuildError");
  } catch (error) {
    assert.ok(error instanceof PlanBuildError, `Expected a PlanBuildError, got ${error}`);
    return error.problems;
  }
}

test("build() returns the decorated plan and its config", () => {
  const { plan, config } = new PlanBuilder()
    .base("basic")
    .named("Plan de la casa")
    .addon("extra-data")
    .addon("roaming")
    .build();

  assert.ok(plan instanceof MobilePlan);
  assert.equal(plan.getPrice(), 35000 + 12000 + 25000);
  assert.equal(plan.getDataGB(), 20);
  assert.equal(plan.getMinutes(), 400);
  assert.equal(plan.getBreakdown().length, 3);

  assert.ok(config instanceof PlanConfig);
  assert.deepEqual(config.toJSON(), {
    id: null,
    name: "Plan de la casa",
    baseId: "basic",
    addonIds: ["extra-data", "roaming"],
    segmentId: null
  });
});

test("addons() adds a batch and a stackable service can repeat", () => {
  const { plan, config } = new PlanBuilder()
    .base("student")
    .addon("extra-data")
    .addons(["extra-data", "streaming"])
    .build();

  assert.equal(plan.getPrice(), 22000 + 12000 * 2 + 18000);
  assert.equal(plan.getDataGB(), 5 + 20 + 5);
  assert.deepEqual(config.addonIds, ["extra-data", "extra-data", "streaming"]);
  assert.equal(config.name, "Mi plan");
});

test("addons() rejects anything that is not an array", () => {
  assert.throws(() => new PlanBuilder().addons("roaming"), TypeError);
});

test("build() reports every problem at once", () => {
  const problems = problemsOf(() =>
    new PlanBuilder()
      .addons(["roaming", "roaming", "licuadora"])
      .build()
  );

  assert.equal(problems.length, 3);
  assert.ok(problems.some((problem) => /Falta elegir un plan base/.test(problem)));
  assert.ok(problems.some((problem) => /"licuadora"/.test(problem)));
  assert.ok(problems.some((problem) => /Roaming internacional/.test(problem)));
});

test("build() rejects unknown base ids", () => {
  const problems = problemsOf(() => new PlanBuilder().base("platino").build());

  assert.equal(problems.length, 1);
  assert.match(problems[0], /plan base/);
  assert.match(problems[0], /"platino"/);
});

test("build() rejects a non stackable service asked for twice", () => {
  const problems = problemsOf(() =>
    new PlanBuilder()
      .base("plus")
      .addons(["streaming", "streaming"])
      .build()
  );

  assert.equal(problems.length, 1);
  assert.match(problems[0], /Streaming de video/);
  assert.match(problems[0], /una vez/);
});

test("the error message repeats every problem", () => {
  const problems = problemsOf(() => new PlanBuilder().base("platino").addon("licuadora").build());

  assert.equal(problems.length, 2);
  assert.ok(problems.every((problem) => typeof problem === "string" && problem.length > 0));
  assert.throws(() => new PlanBuilder().base("platino").build(), (error) => {
    assert.match(error.message, /No se pudo armar el plan/);
    assert.match(error.message, /"platino"/);
    return true;
  });
});

test("fromConfig() rebuilds the same plan out of a config", () => {
  const config = new PlanConfig({
    name: "Recargado",
    baseId: "plus",
    addonIds: ["extra-data", "social-media"]
  });

  const { plan, config: rebuilt } = PlanBuilder.fromConfig(config).build();

  assert.equal(plan.getPrice(), 55000 + 12000 + 6000);
  assert.deepEqual(rebuilt.toJSON(), config.toJSON());
  assert.notEqual(rebuilt, config);
  assert.throws(() => PlanBuilder.fromConfig(null), TypeError);
});

test("fromConfig() keeps the validation of the builder", () => {
  const broken = new PlanConfig({ name: "Roto", baseId: "plus", addonIds: ["streaming", "streaming"] });

  assert.throws(() => PlanBuilder.fromConfig(broken).build(), PlanBuildError);
});

import test from "node:test";
import assert from "node:assert/strict";

import {
  SegmentFactory,
  PersonalSegmentFactory,
  StudentSegmentFactory,
  BusinessSegmentFactory
} from "../js/abstractFactory/SegmentFactory.js";
import { DiscountPolicy } from "../js/abstractFactory/DiscountPolicy.js";
import { SEGMENTS, DEFAULT_SEGMENT_ID, getSegmentFactory, createSegment } from "../js/abstractFactory/segments.js";

import { StudentPlan } from "../js/plans/StudentPlan.js";
import { BasicPlan } from "../js/plans/BasicPlan.js";
import { PlusPlan } from "../js/plans/PlusPlan.js";
import { ExtraDataDecorator } from "../js/decorators/ExtraDataDecorator.js";
import { UnlimitedCallsDecorator } from "../js/decorators/UnlimitedCallsDecorator.js";
import { SocialMediaDecorator } from "../js/decorators/SocialMediaDecorator.js";
import { StreamingDecorator } from "../js/decorators/StreamingDecorator.js";
import { RoamingDecorator } from "../js/decorators/RoamingDecorator.js";
import { DeviceInsuranceDecorator } from "../js/decorators/DeviceInsuranceDecorator.js";

test("SegmentFactory is abstract", () => {
  assert.throws(() => new SegmentFactory(), /abstract/);

  [PersonalSegmentFactory, StudentSegmentFactory, BusinessSegmentFactory].forEach((Factory) => {
    const factory = new Factory();
    assert.ok(factory instanceof SegmentFactory);
  });
});

test("Personal offers everything with no discount", () => {
  const factory = new PersonalSegmentFactory();

  assert.deepEqual(factory.createPlanCatalog(), [StudentPlan, BasicPlan, PlusPlan]);
  assert.deepEqual(factory.createAddonCatalog(), [
    ExtraDataDecorator,
    UnlimitedCallsDecorator,
    SocialMediaDecorator,
    StreamingDecorator,
    RoamingDecorator,
    DeviceInsuranceDecorator
  ]);

  const policy = factory.createDiscountPolicy();
  assert.equal(policy.rate, 0);
  assert.equal(policy.label, "Sin descuento");
  assert.equal(policy.apply(35000), 35000);
});

test("Student offers study plans and services with a 10% discount", () => {
  const factory = new StudentSegmentFactory();

  assert.deepEqual(factory.createPlanCatalog(), [StudentPlan, BasicPlan]);
  assert.deepEqual(factory.createAddonCatalog(), [ExtraDataDecorator, SocialMediaDecorator, StreamingDecorator]);

  const policy = factory.createDiscountPolicy();
  assert.equal(policy.label, "Descuento estudiante 10%");
  assert.equal(policy.rate, 0.1);
  assert.equal(policy.apply(new StudentPlan().getPrice()), 19800);
  assert.equal(policy.apply(35000), 31500);
});

test("Business offers corporate plans with all services and a 5% discount", () => {
  const factory = new BusinessSegmentFactory();

  assert.deepEqual(factory.createPlanCatalog(), [BasicPlan, PlusPlan]);
  assert.equal(factory.createAddonCatalog().length, 6);
  assert.ok(factory.createAddonCatalog().includes(RoamingDecorator));

  const policy = factory.createDiscountPolicy();
  assert.equal(policy.label, "Descuento empresas 5%");
  assert.equal(policy.rate, 0.05);
  assert.equal(policy.apply(new PlusPlan().getPrice()), 52250);
});

test("the discount policy always returns whole pesos", () => {
  assert.equal(new DiscountPolicy({ label: "10%", rate: 0.1 }).apply(23555), 21200);
  assert.equal(new DiscountPolicy({ label: "5%", rate: 0.05 }).apply(12345), 11728);
  assert.throws(() => new DiscountPolicy({ label: "x", rate: 1.5 }), RangeError);
});

test("every factory builds a family of products that match each other", () => {
  SEGMENTS.forEach((Factory) => {
    const factory = new Factory();
    const [firstPlan] = factory.createPlanCatalog();

    assert.ok(firstPlan);
    assert.ok(factory.createDiscountPolicy() instanceof DiscountPolicy);
    assert.equal(factory.offersPlan(firstPlan.ID), true);
    assert.equal(factory.offersPlan("no-existe"), false);
    assert.equal(factory.createPlan(firstPlan.ID), firstPlan);

    const addon = factory.createAddonCatalog()[0];
    assert.equal(factory.offersAddon(addon.ID), true);
    assert.equal(factory.createAddon(addon.ID), addon);
  });
});

test("the segment registry knows every factory and falls back to Personal", () => {
  assert.deepEqual(SEGMENTS, [PersonalSegmentFactory, StudentSegmentFactory, BusinessSegmentFactory]);
  assert.equal(DEFAULT_SEGMENT_ID, "personal");

  assert.equal(getSegmentFactory("estudiante"), StudentSegmentFactory);
  assert.equal(getSegmentFactory("nope"), undefined);
  assert.equal(createSegment("nope").id, "personal");
  assert.equal(createSegment("empresas").label, "Empresas");
  assert.equal(createSegment("empresas").createPlan("student"), undefined);
});

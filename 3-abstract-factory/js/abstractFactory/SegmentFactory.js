import { StudentPlan } from "../plans/StudentPlan.js";
import { BasicPlan } from "../plans/BasicPlan.js";
import { PlusPlan } from "../plans/PlusPlan.js";
import { ExtraDataDecorator } from "../decorators/ExtraDataDecorator.js";
import { UnlimitedCallsDecorator } from "../decorators/UnlimitedCallsDecorator.js";
import { SocialMediaDecorator } from "../decorators/SocialMediaDecorator.js";
import { StreamingDecorator } from "../decorators/StreamingDecorator.js";
import { RoamingDecorator } from "../decorators/RoamingDecorator.js";
import { DeviceInsuranceDecorator } from "../decorators/DeviceInsuranceDecorator.js";
import { DiscountPolicy } from "./DiscountPolicy.js";

/**
 * Abstract Factory: every concrete factory builds a consistent family of
 * products (plan catalog, addon catalog and discount policy), so a segment
 * can never mix plans from one family with the discount of another one.
 */
export class SegmentFactory {
  static ID = null;
  static LABEL = "";
  static DESCRIPTION = "";

  constructor() {
    if (new.target === SegmentFactory) {
      throw new Error("SegmentFactory is abstract");
    }
  }

  get id() {
    return this.constructor.ID;
  }

  get label() {
    return this.constructor.LABEL;
  }

  get description() {
    return this.constructor.DESCRIPTION;
  }

  /** Plan classes offered by this segment. */
  createPlanCatalog() {
    throw new Error("createPlanCatalog() must be implemented");
  }

  /** Decorator classes offered by this segment. */
  createAddonCatalog() {
    throw new Error("createAddonCatalog() must be implemented");
  }

  /** Discount applied to the final price of this segment. */
  createDiscountPolicy() {
    throw new Error("createDiscountPolicy() must be implemented");
  }

  createPlan(id) {
    return this.createPlanCatalog().find((Plan) => Plan.ID === id);
  }

  createAddon(id) {
    return this.createAddonCatalog().find((Addon) => Addon.ID === id);
  }

  offersPlan(id) {
    return Boolean(this.createPlan(id));
  }

  offersAddon(id) {
    return Boolean(this.createAddon(id));
  }
}

export class PersonalSegmentFactory extends SegmentFactory {
  static ID = "personal";
  static LABEL = "Personal";
  static DESCRIPTION = "Todos los planes y todos los servicios, sin descuento.";

  createPlanCatalog() {
    return [StudentPlan, BasicPlan, PlusPlan];
  }

  createAddonCatalog() {
    return [
      ExtraDataDecorator,
      UnlimitedCallsDecorator,
      SocialMediaDecorator,
      StreamingDecorator,
      RoamingDecorator,
      DeviceInsuranceDecorator
    ];
  }

  createDiscountPolicy() {
    return new DiscountPolicy({ label: "Sin descuento", rate: 0 });
  }
}

export class StudentSegmentFactory extends SegmentFactory {
  static ID = "estudiante";
  static LABEL = "Estudiante";
  static DESCRIPTION = "Planes y servicios de estudio, con 10% de descuento.";

  createPlanCatalog() {
    return [StudentPlan, BasicPlan];
  }

  createAddonCatalog() {
    return [ExtraDataDecorator, SocialMediaDecorator, StreamingDecorator];
  }

  createDiscountPolicy() {
    return new DiscountPolicy({ label: "Descuento estudiante 10%", rate: 0.1 });
  }
}

export class BusinessSegmentFactory extends SegmentFactory {
  static ID = "empresas";
  static LABEL = "Empresas";
  static DESCRIPTION = "Planes corporativos con 5% de descuento.";

  createPlanCatalog() {
    return [BasicPlan, PlusPlan];
  }

  createAddonCatalog() {
    return [
      ExtraDataDecorator,
      UnlimitedCallsDecorator,
      SocialMediaDecorator,
      StreamingDecorator,
      RoamingDecorator,
      DeviceInsuranceDecorator
    ];
  }

  createDiscountPolicy() {
    return new DiscountPolicy({ label: "Descuento empresas 5%", rate: 0.05 });
  }
}

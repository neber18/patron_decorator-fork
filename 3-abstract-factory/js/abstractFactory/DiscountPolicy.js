/**
 * Product of the Abstract Factory: the discount policy of a segment.
 * `apply()` returns whole pesos, because the site never shows cents.
 */
export class DiscountPolicy {
  constructor({ label, rate }) {
    if (!(rate >= 0 && rate < 1)) {
      throw new RangeError("The discount rate must be a number between 0 and 1");
    }
    this.label = label;
    this.rate = rate;
  }

  apply(price) {
    return Math.round(price * (1 - this.rate));
  }
}

import { describe, expect, it } from "vitest";
import {
  activeStep,
  beverageYield,
  brewFor,
  fillPot,
  potSize,
  schedule,
  servings,
  setCoffee,
  setRatio,
  setServings,
  setWater,
  shots,
  switchMethod,
  totalTime,
} from "./brew";
import { getMethod, methods } from "./methods";

describe("ratio math", () => {
  it("derives water from coffee", () => {
    const brew = setCoffee(brewFor("v60"), 20);
    expect(brew.water).toBe(320);
    expect(brew.lock).toBe("coffee");
  });

  it("derives coffee from water", () => {
    const brew = setWater(brewFor("v60"), 500);
    expect(brew.coffee).toBeCloseTo(31.25);
    expect(brew.lock).toBe("water");
  });

  it("keeps whichever side was set last when the ratio changes", () => {
    const byCoffee = setRatio(setCoffee(brewFor("v60"), 20), 15);
    expect(byCoffee).toMatchObject({ coffee: 20, water: 300 });

    const byWater = setRatio(setWater(brewFor("v60"), 300), 15);
    expect(byWater).toMatchObject({ water: 300, coffee: 20 });
  });

  it("ignores zero, negative, and non-numeric input", () => {
    const brew = brewFor("v60");
    expect(setCoffee(brew, 0)).toBe(brew);
    expect(setWater(brew, -5)).toBe(brew);
    expect(setRatio(brew, Number.NaN)).toBe(brew);
    expect(setServings(brew, Infinity)).toBe(brew);
  });
});

describe("servings", () => {
  it("measures filter coffee in cups of water", () => {
    const brew = setServings(brewFor("chemex"), 3);
    expect(brew.water).toBe(750);
    expect(servings(brew)).toBe(3);
  });

  it("measures espresso in doses of coffee", () => {
    const brew = setServings(brewFor("espresso"), 2);
    expect(brew).toMatchObject({ coffee: 36, water: 72 });
    expect(servings(brew)).toBe(2);
  });

  it("starts every method at its default size", () => {
    for (const method of methods) {
      const brew = brewFor(method.id);
      if (method.serving.kind === "pot") expect(potSize(brew)).toBe(method.serving.sizes[0]);
      else expect(servings(brew)).toBeCloseTo(method.serving.default);
    }
  });
});

describe("espresso shots", () => {
  it("pulls two or more doubles one at a time, each to its own target", () => {
    const brew = setServings(brewFor("espresso"), 2);
    expect(shots(brew)).toBe(2);
    expect(schedule(brew).at(-1)?.target).toBe(36);
    expect(beverageYield(brew)).toBe(36);
  });

  it("treats any other dose as one shot", () => {
    for (const coffee of [18, 20, 27]) {
      const brew = setCoffee(brewFor("espresso"), coffee);
      expect(shots(brew)).toBe(1);
      expect(schedule(brew).at(-1)?.target).toBe(coffee * 2);
    }
  });

  it("counts doses the way the stepper shows them", () => {
    // 1.27 oz is about 36.004 g, which the stepper shows as 2 double shots.
    expect(shots(setCoffee(brewFor("espresso"), 36.004))).toBe(2);
    // 37 g shows as 2.1.
    expect(shots(setCoffee(brewFor("espresso"), 37))).toBe(1);
  });

  it("never splits other methods", () => {
    expect(shots(setServings(brewFor("chemex"), 3))).toBe(1);
    expect(shots(brewFor("moka"))).toBe(1);
  });
});

describe("moka pot", () => {
  const sizes = (() => {
    const { serving } = getMethod("moka");
    if (serving.kind !== "pot") throw new Error("The moka pot should come in sizes");
    return serving.sizes;
  })();

  it("starts with the small pot, filled to the valve", () => {
    const brew = brewFor("moka");
    expect(brew).toMatchObject({ coffee: 15, water: 150, ratio: 10, lock: "coffee" });
    expect(potSize(brew)?.label).toBe("3-cup");
  });

  it("switches between pot sizes", () => {
    const brew = fillPot(brewFor("moka"), sizes[1]);
    expect(brew).toMatchObject({ coffee: 30, water: 300, ratio: 10 });
    expect(potSize(brew)?.label).toBe("6-cup");
    expect(potSize(fillPot(brew, sizes[0]))?.label).toBe("3-cup");
  });

  it("stops matching a size once the amounts change by hand", () => {
    const brew = setRatio(brewFor("moka"), 9);
    expect(brew).toMatchObject({ coffee: 15, water: 135 });
    expect(potSize(brew)).toBeNull();
  });

  it("makes one potful rather than a number of cups", () => {
    const brew = brewFor("moka");
    expect(servings(brew)).toBe(1);
    expect(setServings(brew, 2)).toBe(brew);
  });

  it("only has sizes for pots", () => {
    expect(potSize(brewFor("v60"))).toBeNull();
  });
});

describe("switching methods", () => {
  it("keeps the amount of water between filter methods", () => {
    const brew = switchMethod(setWater(brewFor("v60"), 500), "french-press");
    expect(brew).toMatchObject({ method: "french-press", water: 500, ratio: 15 });
    expect(brew.coffee).toBeCloseTo(33.33, 2);
  });

  it("starts espresso fresh rather than pulling a 500 g shot", () => {
    const brew = switchMethod(setWater(brewFor("v60"), 500), "espresso");
    expect(brew).toEqual(brewFor("espresso"));
    expect(switchMethod(brew, "v60")).toEqual(brewFor("v60"));
  });

  it("starts the moka pot at a size rather than carrying cups over", () => {
    const brew = switchMethod(setWater(brewFor("v60"), 500), "moka");
    expect(brew).toEqual(brewFor("moka"));
    expect(switchMethod(brew, "v60")).toEqual(brewFor("v60"));
  });

  it("returns the same brew when the method doesn't change", () => {
    const brew = brewFor("aeropress");
    expect(switchMethod(brew, "aeropress")).toBe(brew);
  });
});

describe("yield", () => {
  it("subtracts what the grounds soak up", () => {
    expect(beverageYield(setCoffee(brewFor("v60"), 20))).toBe(280);
  });

  it("treats espresso's water as the yield itself", () => {
    expect(beverageYield(brewFor("espresso"))).toBe(36);
  });

  it("never goes negative on a silly ratio", () => {
    expect(beverageYield(setRatio(brewFor("aeropress"), 1))).toBe(0);
  });
});

describe("schedule", () => {
  it("fills in running pour targets", () => {
    const steps = schedule(setCoffee(brewFor("v60"), 20));
    expect(steps.map((s) => s.target)).toEqual([40, 192, 320, undefined, undefined]);
  });

  it("caps the bloom at the total water", () => {
    const [bloom] = schedule(setRatio(setCoffee(brewFor("v60"), 20), 1.5));
    expect(bloom.target).toBe(30);
  });

  it("knows how long each step lasts", () => {
    const steps = schedule(brewFor("french-press"));
    expect(steps.map((s) => s.duration)).toEqual([240, 30, null]);
  });

  it("finds the active step for an elapsed time", () => {
    const steps = getMethod("v60").steps;
    expect(activeStep(steps, -1)).toBe(-1);
    expect(activeStep(steps, 0)).toBe(0);
    expect(activeStep(steps, 44.9)).toBe(0);
    expect(activeStep(steps, 45)).toBe(1);
    expect(activeStep(steps, 9999)).toBe(steps.length - 1);
  });

  it("every method's steps are in order and end with the full pour", () => {
    for (const method of methods) {
      const times = method.steps.map((s) => s.at);
      expect(times).toEqual([...times].sort((a, b) => a - b));
      const targets = schedule(brewFor(method.id)).flatMap((s) => s.target ?? []);
      expect(targets.at(-1)).toBeCloseTo(brewFor(method.id).water);
      expect(totalTime(method)).toBe(times.at(-1));
    }
  });
});

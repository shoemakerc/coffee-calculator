import { getMethod, type Method, type MethodId, type PotSize, type Step } from "./methods";

/**
 * A brew is a coffee weight, a water weight, and the ratio between them.
 * Whichever of coffee or water you touched last stays put ("locked") when
 * the ratio changes, which is how a barista thinks about it: "I have 20 g
 * of beans" or "I want a 500 g pot."
 */
export type Brew = {
  method: MethodId;
  coffee: number; // grams
  water: number; // grams (1 g of water ≈ 1 ml)
  ratio: number; // water ÷ coffee
  lock: "coffee" | "water";
};

const positive = (n: number) => Number.isFinite(n) && n > 0;

export function brewFor(id: MethodId, servings?: number): Brew {
  const method = getMethod(id);
  const base: Brew = { method: id, coffee: 1, water: method.ratio, ratio: method.ratio, lock: "coffee" };
  return method.serving.kind === "pot"
    ? fillPot(base, method.serving.sizes[0])
    : setServings(base, servings ?? method.serving.default);
}

export function setCoffee(brew: Brew, coffee: number): Brew {
  if (!positive(coffee)) return brew;
  return { ...brew, coffee, water: coffee * brew.ratio, lock: "coffee" };
}

export function setWater(brew: Brew, water: number): Brew {
  if (!positive(water)) return brew;
  return { ...brew, water, coffee: water / brew.ratio, lock: "water" };
}

export function setRatio(brew: Brew, ratio: number): Brew {
  if (!positive(ratio)) return brew;
  return brew.lock === "coffee"
    ? { ...brew, ratio, water: brew.coffee * ratio }
    : { ...brew, ratio, coffee: brew.water / ratio };
}

/**
 * How many cups (or shots, or batches) this brew makes. A pot always makes
 * one potful: it changes size, not count.
 */
export function servings(brew: Brew): number {
  const { serving } = getMethod(brew.method);
  if (serving.kind === "pot") return 1;
  return (serving.kind === "water" ? brew.water : brew.coffee) / serving.grams;
}

export function setServings(brew: Brew, count: number): Brew {
  const { serving } = getMethod(brew.method);
  if (!positive(count) || serving.kind === "pot") return brew;
  return serving.kind === "water"
    ? setWater(brew, count * serving.grams)
    : setCoffee(brew, count * serving.grams);
}

/** Servings to one decimal place, the way the stepper shows them. */
export const roundServings = (count: number) => Number(count.toFixed(1));

/**
 * How many shots to pull, one after another. Two or more whole doses (as
 * the stepper rounds them) are separate shots. Any other dose, like 20 g,
 * is one shot, and every other method is a single brew.
 */
export function shots(brew: Brew): number {
  const { serving } = getMethod(brew.method);
  if (serving.kind !== "coffee") return 1;
  const count = roundServings(servings(brew));
  return Number.isInteger(count) && count > 1 ? count : 1;
}

/** Fill a pot the usual way: a level basket of coffee, water up to the valve. */
export function fillPot(brew: Brew, size: PotSize): Brew {
  return { ...brew, coffee: size.coffee, water: size.water, ratio: size.water / size.coffee, lock: "coffee" };
}

/** Which pot size these amounts fill, or null once they've been changed by hand. */
export function potSize(brew: Brew): PotSize | null {
  const { serving } = getMethod(brew.method);
  if (serving.kind !== "pot") return null;
  const near = (a: number, b: number) => Math.abs(a - b) < 0.5;
  return serving.sizes.find((s) => near(s.coffee, brew.coffee) && near(s.water, brew.water)) ?? null;
}

/**
 * Switch methods, keeping the size of the brew where it makes sense. Going
 * from a two-cup Chemex to a French press keeps two cups. Espresso is
 * measured in shots and a moka pot by its size, not in cups, so switching
 * to or from either starts over at that method's defaults.
 */
export function switchMethod(brew: Brew, id: MethodId): Brew {
  if (id === brew.method) return brew;
  const from = getMethod(brew.method);
  const to = getMethod(id);
  if (from.serving.kind !== to.serving.kind || to.serving.kind === "pot") return brewFor(id);
  const fresh: Brew = { ...brew, method: id, ratio: to.ratio };
  return to.serving.kind === "coffee"
    ? setCoffee(fresh, brew.coffee)
    : setWater(fresh, brew.water);
}

/** Grounds hold onto about twice their weight in water. */
export const ABSORPTION = 2;

/**
 * Roughly how much ends up in the cup (or carafe, or jar). Separate shots
 * each get their own cup.
 */
export function beverageYield(brew: Brew): number {
  const method = getMethod(brew.method);
  const total = method.waterIsYield ? brew.water : Math.max(0, brew.water - brew.coffee * ABSORPTION);
  return total / shots(brew);
}

export type ScheduledStep = Step & {
  /** Running total of water on the scale after this step, if it's a pour. */
  target?: number;
  /** Seconds until the next step starts, or null for the last one. */
  duration: number | null;
};

/**
 * Steps with actual gram targets filled in for this brew. Separate shots
 * each run through the steps, so their targets are per shot.
 */
export function schedule(brew: Brew, method: Method = getMethod(brew.method)): ScheduledStep[] {
  const n = shots(brew);
  const coffee = brew.coffee / n;
  const water = brew.water / n;
  return method.steps.map((step, i) => {
    const next = method.steps[i + 1];
    const duration = next ? next.at - step.at : null;
    if (!step.pour) return { ...step, duration };
    const target =
      step.pour.kind === "bloom"
        ? Math.min(coffee * step.pour.times, water)
        : water * step.pour.of;
    return { ...step, target, duration };
  });
}

/** Index of the step that's underway at `elapsed` seconds (-1 before any). */
export function activeStep(steps: Pick<Step, "at">[], elapsed: number): number {
  let active = -1;
  steps.forEach((step, i) => {
    if (elapsed >= step.at) active = i;
  });
  return active;
}

/** Brew length: when the last step starts. */
export const totalTime = (method: Method) => method.steps.at(-1)?.at ?? 0;

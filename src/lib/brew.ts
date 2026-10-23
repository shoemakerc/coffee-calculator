import { getMethod, type Method, type MethodId, type Step } from "./methods";

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
  return setServings(base, servings ?? method.defaultServings);
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

/** How many cups (or shots, or batches) this brew makes. */
export function servings(brew: Brew): number {
  const { serving } = getMethod(brew.method);
  return (serving.kind === "water" ? brew.water : brew.coffee) / serving.grams;
}

export function setServings(brew: Brew, count: number): Brew {
  if (!positive(count)) return brew;
  const { serving } = getMethod(brew.method);
  return serving.kind === "water"
    ? setWater(brew, count * serving.grams)
    : setCoffee(brew, count * serving.grams);
}

/**
 * Switch methods, keeping the size of the brew where it makes sense. Going
 * from a two-cup Chemex to a French press keeps two cups. Espresso is
 * measured in shots, not cups, so switching to or from it starts over at
 * that method's defaults.
 */
export function switchMethod(brew: Brew, id: MethodId): Brew {
  if (id === brew.method) return brew;
  const from = getMethod(brew.method);
  const to = getMethod(id);
  if (from.serving.kind !== to.serving.kind) return brewFor(id);
  const fresh: Brew = { ...brew, method: id, ratio: to.ratio };
  return to.serving.kind === "coffee"
    ? setCoffee(fresh, brew.coffee)
    : setWater(fresh, brew.water);
}

/** Grounds hold onto about twice their weight in water. */
export const ABSORPTION = 2;

/** Roughly how much ends up in the cup (or carafe, or jar). */
export function beverageYield(brew: Brew): number {
  const method = getMethod(brew.method);
  if (method.waterIsYield) return brew.water;
  return Math.max(0, brew.water - brew.coffee * ABSORPTION);
}

export type ScheduledStep = Step & {
  /** Running total of water on the scale after this step, if it's a pour. */
  target?: number;
  /** Seconds until the next step starts, or null for the last one. */
  duration: number | null;
};

/** Steps with actual gram targets filled in for this brew. */
export function schedule(brew: Brew, method: Method = getMethod(brew.method)): ScheduledStep[] {
  return method.steps.map((step, i) => {
    const next = method.steps[i + 1];
    const duration = next ? next.at - step.at : null;
    if (!step.pour) return { ...step, duration };
    const target =
      step.pour.kind === "bloom"
        ? Math.min(brew.coffee * step.pour.times, brew.water)
        : brew.water * step.pour.of;
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

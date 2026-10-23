/**
 * Brew methods and their house recipes. Everything else in the app derives
 * from these, so tweak a ratio or a pour time here and the calculator,
 * spec sheet, and timer all follow.
 */

export type MethodId =
  | "v60"
  | "chemex"
  | "french-press"
  | "aeropress"
  | "espresso"
  | "cold-brew";

/** How much water a step should bring the total to. */
export type PourTarget =
  | { kind: "bloom"; times: number } // a multiple of the coffee weight
  | { kind: "fraction"; of: number }; // a share of the total water

export type Step = {
  /** Seconds from the start of the brew. */
  at: number;
  title: string;
  detail?: string;
  pour?: PourTarget;
};

/** What one "serving" means: a cup of water, or a dose of coffee. */
export type Serving =
  | { kind: "water"; grams: number; label: string }
  | { kind: "coffee"; grams: number; label: string };

export type Method = {
  id: MethodId;
  name: string;
  /** Short name for tabs. */
  short: string;
  blurb: string;
  /** Grams of water (or beverage, for espresso) per gram of coffee. */
  ratio: number;
  /** Sensible bounds for the ratio input. */
  ratioRange: [number, number];
  grind: string;
  /** Water temperature in °C, or null for no heat. */
  tempC: number | null;
  serving: Serving;
  defaultServings: number;
  /** Whether the step list is short enough to run a live timer against. */
  timed: boolean;
  /** For espresso the "water" is what ends up in the cup, not what goes in. */
  waterIsYield: boolean;
  /** Notes on what ends up in the cup. */
  yieldNote?: string;
  steps: Step[];
};

const bloom = (times = 2): PourTarget => ({ kind: "bloom", times });
const to = (of: number): PourTarget => ({ kind: "fraction", of });

export const methods: Method[] = [
  {
    id: "v60",
    name: "Pour-over (V60)",
    short: "V60",
    blurb: "Clean and bright. A short bloom, two main pours, then a swirl.",
    ratio: 16,
    ratioRange: [12, 20],
    grind: "Medium-fine, like table salt",
    tempC: 94,
    serving: { kind: "water", grams: 250, label: "cup" },
    defaultServings: 1,
    timed: true,
    waterIsYield: false,
    steps: [
      { at: 0, title: "Bloom", detail: "Wet all the grounds, then swirl.", pour: bloom() },
      { at: 45, title: "First pour", detail: "Slow spirals, avoiding the paper.", pour: to(0.6) },
      { at: 75, title: "Second pour", detail: "Same again, to the top.", pour: to(1) },
      { at: 105, title: "Swirl", detail: "One gentle swirl to flatten the bed, then let it draw down." },
      { at: 180, title: "Done", detail: "Drawdown should finish around now. Faster: grind finer." },
    ],
  },
  {
    id: "chemex",
    name: "Chemex",
    short: "Chemex",
    blurb: "Thick filter, sweet and tea-like. Good for a few people at once.",
    ratio: 16,
    ratioRange: [13, 19],
    grind: "Medium-coarse, like kosher salt",
    tempC: 95,
    serving: { kind: "water", grams: 250, label: "cup" },
    defaultServings: 2,
    timed: true,
    waterIsYield: false,
    steps: [
      { at: 0, title: "Bloom", detail: "Wet all the grounds and give it a stir.", pour: bloom() },
      { at: 45, title: "First pour", detail: "Spiral out from the center.", pour: to(0.5) },
      { at: 90, title: "Second pour", pour: to(0.75) },
      { at: 135, title: "Final pour", pour: to(1) },
      { at: 240, title: "Done", detail: "Pull the filter once the drip slows to a trickle." },
    ],
  },
  {
    id: "french-press",
    name: "French press",
    short: "Press",
    blurb: "Full-bodied and forgiving. All the water at once, then wait.",
    ratio: 15,
    ratioRange: [10, 18],
    grind: "Coarse, like breadcrumbs",
    tempC: 95,
    serving: { kind: "water", grams: 250, label: "cup" },
    defaultServings: 2,
    timed: true,
    waterIsYield: false,
    steps: [
      { at: 0, title: "Add all the water", detail: "Make sure every ground gets wet.", pour: to(1) },
      { at: 240, title: "Break the crust", detail: "Stir the top, then skim off the foam." },
      { at: 270, title: "Plunge and pour", detail: "Press gently, and pour it all out so it stops brewing." },
    ],
  },
  {
    id: "aeropress",
    name: "AeroPress",
    short: "AeroPress",
    blurb: "Quick, clean, and hard to mess up. One mug at a time.",
    ratio: 15,
    ratioRange: [6, 18],
    grind: "Medium-fine",
    tempC: 90,
    serving: { kind: "water", grams: 230, label: "mug" },
    defaultServings: 1,
    timed: true,
    waterIsYield: false,
    steps: [
      { at: 0, title: "Add the water", pour: to(1) },
      { at: 10, title: "Stir and cap", detail: "Three stirs, then set the plunger in to hold the vacuum." },
      { at: 90, title: "Swirl", detail: "A gentle swirl so nothing sticks to the walls." },
      { at: 120, title: "Press", detail: "Slow and steady, about 30 seconds. Stop at the hiss." },
      { at: 150, title: "Done" },
    ],
  },
  {
    id: "espresso",
    name: "Espresso",
    short: "Espresso",
    blurb: "Dose in, liquid out. The ratio is coffee to what lands in the cup.",
    ratio: 2,
    ratioRange: [1, 4],
    grind: "Fine, like powdered sugar",
    tempC: 93,
    serving: { kind: "coffee", grams: 18, label: "shot" },
    defaultServings: 1,
    timed: true,
    waterIsYield: true,
    yieldNote: "This is a weight target for the cup. Put a scale under it.",
    steps: [
      { at: 0, title: "Start the shot", detail: "First drops should show up within 5–8 seconds." },
      { at: 28, title: "Stop at the target", detail: "Under 25 seconds: grind finer. Over 32: coarser.", pour: to(1) },
    ],
  },
  {
    id: "cold-brew",
    name: "Cold brew",
    short: "Cold brew",
    blurb: "A concentrate that sits overnight. Cut it with water or milk to serve.",
    ratio: 8,
    ratioRange: [4, 12],
    grind: "Extra-coarse, like peppercorns",
    tempC: null,
    serving: { kind: "water", grams: 250, label: "batch" },
    defaultServings: 4,
    timed: false,
    waterIsYield: false,
    yieldNote: "Concentrate. Dilute about 1:1 to serve.",
    steps: [
      { at: 0, title: "Combine", detail: "Add the grounds and water, and stir until everything is wet.", pour: to(1) },
      { at: 0, title: "Cover and chill", detail: "Put it in the fridge." },
      { at: 16 * 3600, title: "Strain", detail: "Anywhere from 12 to 18 hours. Strain it through a paper filter." },
      { at: 16 * 3600, title: "Serve", detail: "Cut about 1:1 with water or milk, over ice. Keeps for a week." },
    ],
  },
];

export const getMethod = (id: MethodId): Method => {
  const method = methods.find((m) => m.id === id);
  if (!method) throw new Error(`Unknown brew method: ${id}`);
  return method;
};

export const isMethodId = (value: unknown): value is MethodId =>
  methods.some((m) => m.id === value);

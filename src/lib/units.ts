export type MassUnit = "g" | "oz";
export type TempUnit = "C" | "F";

export const GRAMS_PER_OUNCE = 28.349523125;

export const toUnit = (grams: number, unit: MassUnit) =>
  unit === "g" ? grams : grams / GRAMS_PER_OUNCE;

export const fromUnit = (value: number, unit: MassUnit) =>
  unit === "g" ? value : value * GRAMS_PER_OUNCE;

export const cToF = (c: number) => (c * 9) / 5 + 32;

/** Trim trailing zeros: 20.0 → "20", 18.50 → "18.5". */
const trim = (n: number, digits: number) => String(Number(n.toFixed(digits)));

/**
 * How precisely to show a weight. Coffee gets a decimal (a scale reads
 * tenths). Water rounds to the gram, since nobody pours 312.4 g. Ounces
 * are bigger, so they always get some decimals.
 */
export function formatMass(grams: number, unit: MassUnit, kind: "coffee" | "water"): string {
  const value = toUnit(grams, unit);
  if (unit === "oz") return trim(value, kind === "coffee" ? 2 : 1);
  return trim(value, kind === "coffee" ? 1 : 0);
}

export function formatRatio(ratio: number): string {
  return trim(ratio, 1);
}

export function formatTemp(c: number | null, unit: TempUnit): string {
  if (c === null) return "Cold or room temp";
  return unit === "C" ? `${Math.round(c)} °C` : `${Math.round(cToF(c))} °F`;
}

/** Seconds as a clock: 0:45, 4:30, 1:02:03. Long waits read as hours. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** A step's start time: clock for short brews, hours for overnight ones. */
export function formatAt(seconds: number, timed: boolean): string {
  if (timed) return formatClock(seconds);
  return `${trim(seconds / 3600, 1)} h`;
}

/** Parse what someone typed into a number field, forgiving commas. */
export function parseNumber(text: string): number | null {
  const n = Number(text.trim().replace(",", "."));
  return text.trim() !== "" && Number.isFinite(n) ? n : null;
}

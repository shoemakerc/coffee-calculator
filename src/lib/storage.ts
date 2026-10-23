import { useSyncExternalStore } from "react";
import type { Brew } from "./brew";
import { isMethodId } from "./methods";
import type { MassUnit, TempUnit } from "./units";

/**
 * Tiny localStorage-backed stores. Everything here lives only in this
 * browser; there's no account and no server. Reads are wrapped because
 * storage can be missing or blocked (private windows, strict settings),
 * and the app should still work, it just won't remember anything.
 */

export type SavedRecipe = Brew & { id: string; name: string; savedAt: number };

export type Prefs = { mass: MassUnit; temp: TempUnit; sound: boolean };

const KEYS = { recipes: "coffee-calculator:recipes", prefs: "coffee-calculator:prefs" };
const CHANGE = "coffee-calculator:change";

export const defaultPrefs: Prefs = { mass: "g", temp: "C", sound: true };
const noRecipes: SavedRecipe[] = [];

function parseJSON(raw: string | null): unknown {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is full or blocked; the change just won't persist.
  }
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Keep parsed values stable between reads so React doesn't loop. */
function cached<T>(key: string, parse: (raw: unknown) => T, fallback: T) {
  let lastRaw: string | null | undefined;
  let lastValue = fallback;
  return () => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return fallback;
    }
    if (raw !== lastRaw) {
      lastRaw = raw;
      lastValue = parse(parseJSON(raw));
    }
    return lastValue;
  };
}

const isRecipe = (r: unknown): r is SavedRecipe => {
  if (!r || typeof r !== "object") return false;
  const x = r as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    typeof x.name === "string" &&
    isMethodId(x.method) &&
    [x.coffee, x.water, x.ratio].every((n) => typeof n === "number" && n > 0) &&
    (x.lock === "coffee" || x.lock === "water")
  );
};

const getRecipes = cached(
  KEYS.recipes,
  (raw) => (Array.isArray(raw) ? raw.filter(isRecipe) : noRecipes),
  noRecipes,
);

const getPrefs = cached(
  KEYS.prefs,
  (raw) => {
    const p = (raw ?? {}) as Partial<Prefs>;
    return {
      mass: p.mass === "oz" ? "oz" : "g",
      temp: p.temp === "F" ? "F" : "C",
      sound: p.sound !== false,
    } satisfies Prefs;
  },
  defaultPrefs,
);

export function useRecipes() {
  return useSyncExternalStore(subscribe, getRecipes, () => noRecipes);
}

export function usePrefs() {
  return useSyncExternalStore(subscribe, getPrefs, () => defaultPrefs);
}

export function setPrefs(patch: Partial<Prefs>) {
  write(KEYS.prefs, { ...getPrefs(), ...patch });
}

export function saveRecipe(brew: Brew, name: string) {
  const recipe: SavedRecipe = {
    ...brew,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim() || "Untitled",
    savedAt: Date.now(),
  };
  write(KEYS.recipes, [recipe, ...getRecipes()]);
}

export function deleteRecipe(id: string) {
  write(KEYS.recipes, getRecipes().filter((r) => r.id !== id));
}

"use client";

import { useState, type KeyboardEvent } from "react";
import { parseNumber } from "@/lib/units";

/** Tabular figures are each 1ch wide; a decimal point is much narrower. */
const fieldWidth = (text: string) => {
  const points = (text.match(/[.,]/g) ?? []).length;
  const digits = Math.max(text.length - points, 1);
  return `calc(${digits}ch + ${points * 0.3}ch + 0.1em)`;
};

type Props = {
  id: string;
  value: number;
  format: (value: number) => string;
  /** Called with every valid positive number as it's typed. */
  onChange: (value: number) => void;
  /** Amount the arrow keys nudge by (shift for ten times as much). */
  step: number;
  "aria-describedby"?: string;
};

/**
 * A text field for numbers that doesn't fight you while you type. It shows
 * the formatted value until you focus it, then keeps exactly what you've
 * typed (half-typed "18." and all) until you leave, while still pushing
 * each valid number up so the other fields update live.
 */
export function NumberField({ id, value, format, onChange, step, ...rest }: Props) {
  const [draft, setDraft] = useState<string | null>(null);

  function nudge(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const amount = (event.shiftKey ? 10 : 1) * step * (event.key === "ArrowUp" ? 1 : -1);
    // Work in what's on screen, which may be ounces rather than grams.
    const current = parseNumber(draft ?? "") ?? parseNumber(format(value)) ?? 0;
    // Snap to the step so 20.3 nudges to 20.5 rather than 20.8.
    const next = Number((Math.round((current + amount) / step) * step).toFixed(4));
    if (next <= 0) return;
    onChange(next);
    setDraft(format(next));
  }

  const text = draft ?? format(value);

  return (
    <input
      id={id}
      className="figure-input"
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      value={text}
      // Size to the digits so the unit sits right after the number.
      style={{ width: fieldWidth(text) }}
      onFocus={(event) => {
        setDraft(format(value));
        event.target.select();
      }}
      onChange={(event) => {
        setDraft(event.target.value);
        const n = parseNumber(event.target.value);
        if (n !== null && n > 0) onChange(n);
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={nudge}
      {...rest}
    />
  );
}

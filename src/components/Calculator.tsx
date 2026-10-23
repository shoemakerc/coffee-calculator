"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  beverageYield,
  brewFor,
  schedule,
  servings,
  setCoffee,
  setRatio,
  setServings,
  setWater,
  switchMethod,
  totalTime,
  type Brew,
} from "@/lib/brew";
import { getMethod, methods, type MethodId } from "@/lib/methods";
import {
  deleteRecipe,
  saveRecipe,
  setPrefs,
  usePrefs,
  useRecipes,
} from "@/lib/storage";
import {
  formatClock,
  formatMass,
  formatRatio,
  formatTemp,
  fromUnit,
  type MassUnit,
} from "@/lib/units";
import { Staff } from "./chrome";
import { NumberField } from "./NumberField";
import { Timer } from "./Timer";

const plural = (n: number, word: string) => (Math.abs(n - 1) < 1e-9 ? word : `${word}s`);

/** Whole servings show as "2"; anything else gets a decimal ("1.5"). */
const formatServings = (n: number) => String(Number(n.toFixed(1)));

export function Calculator() {
  const [brew, setBrew] = useState<Brew>(() => brewFor("v60"));
  const [recipeName, setRecipeName] = useState("");
  const prefs = usePrefs();
  const recipes = useRecipes();
  const top = useRef<HTMLDivElement>(null);

  const method = getMethod(brew.method);
  const unit: MassUnit = prefs.mass;
  const steps = useMemo(() => schedule(brew), [brew]);
  const count = servings(brew);
  const mass = (grams: number, kind: "coffee" | "water") => `${formatMass(grams, unit, kind)} ${unit}`;
  const suggestedName = `${method.short} · ${mass(brew.coffee, "coffee")} · 1:${formatRatio(brew.ratio)}`;

  // Arrow-key step sizes, in whatever unit is showing.
  const coffeeStep = unit === "g" ? 0.5 : 0.05;
  const waterStep = unit === "g" ? 10 : 0.5;
  const servingStep = method.serving.kind === "coffee" ? 1 : 0.5;

  function save(event: FormEvent) {
    event.preventDefault();
    saveRecipe(brew, recipeName || suggestedName);
    setRecipeName("");
  }

  function load(saved: Brew) {
    setBrew({
      method: saved.method,
      coffee: saved.coffee,
      water: saved.water,
      ratio: saved.ratio,
      lock: saved.lock,
    });
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="calculator" ref={top}>
      <fieldset className="methods">
        <legend className="visually-hidden">Brew method</legend>
        {methods.map((m) => (
          <label key={m.id} className="method-tab">
            <input
              type="radio"
              name="method"
              value={m.id}
              checked={m.id === brew.method}
              onChange={() => setBrew((b) => switchMethod(b, m.id as MethodId))}
            />
            <span>{m.short}</span>
          </label>
        ))}
      </fieldset>

      <div className="method-head">
        <h2 className="section-title">{method.name}</h2>
        <p className="lede-small">{method.blurb}</p>
      </div>

      <div className="figures">
        <div className="figure">
          <label htmlFor="coffee" className="meta">
            Coffee
          </label>
          <div className="figure-value">
            <NumberField
              id="coffee"
              value={brew.coffee}
              format={(g) => formatMass(g, unit, "coffee")}
              onChange={(v) => setBrew((b) => setCoffee(b, fromUnit(v, unit)))}
              step={coffeeStep}
            />
            <span className="figure-unit">{unit}</span>
          </div>
          {brew.lock === "coffee" && <span className="meta figure-lock">Held</span>}
        </div>

        <div className="figure figure-ratio">
          <label htmlFor="ratio" className="meta">
            Ratio
          </label>
          <div className="figure-value">
            <span className="figure-unit figure-unit-lead">1 :</span>
            <NumberField
              id="ratio"
              value={brew.ratio}
              format={formatRatio}
              onChange={(v) => setBrew((b) => setRatio(b, v))}
              step={method.ratio < 4 ? 0.1 : 0.5}
              aria-describedby="ratio-hint"
            />
          </div>
          <span id="ratio-hint" className="meta figure-lock">
            Typical {method.ratioRange[0]}–{method.ratioRange[1]}
          </span>
        </div>

        <div className="figure">
          <label htmlFor="water" className="meta">
            {method.waterIsYield ? "In the cup" : "Water"}
          </label>
          <div className="figure-value">
            <NumberField
              id="water"
              value={brew.water}
              format={(g) => formatMass(g, unit, "water")}
              onChange={(v) => setBrew((b) => setWater(b, fromUnit(v, unit)))}
              step={waterStep}
            />
            <span className="figure-unit">{unit}</span>
          </div>
          {brew.lock === "water" && <span className="meta figure-lock">Held</span>}
        </div>
      </div>

      <div className="toolbar">
        <div className="stepper" role="group" aria-label={`Number of ${method.serving.label}s`}>
          <button
            type="button"
            className="button button-icon"
            aria-label={`One less ${method.serving.label}`}
            disabled={count <= servingStep + 1e-9}
            onClick={() => setBrew((b) => setServings(b, Math.max(servingStep, servings(b) - servingStep)))}
          >
            −
          </button>
          <span className="stepper-value" aria-live="polite">
            {formatServings(count)} {plural(count, method.serving.label)}
          </span>
          <button
            type="button"
            className="button button-icon"
            aria-label={`One more ${method.serving.label}`}
            onClick={() => setBrew((b) => setServings(b, servings(b) + servingStep))}
          >
            +
          </button>
        </div>

        <div className="toggles">
          <Toggle
            label="Weight"
            options={["g", "oz"]}
            value={prefs.mass}
            onChange={(mass) => setPrefs({ mass })}
          />
          <Toggle
            label="Temperature"
            options={["C", "F"]}
            display={(t) => `°${t}`}
            value={prefs.temp}
            onChange={(temp) => setPrefs({ temp })}
          />
        </div>
      </div>

      <dl className="specs">
        <div>
          <dt className="meta">Grind</dt>
          <dd>{method.grind}</dd>
        </div>
        <div>
          <dt className="meta">Water temp</dt>
          <dd>{formatTemp(method.tempC, prefs.temp)}</dd>
        </div>
        <div>
          <dt className="meta">Brew time</dt>
          <dd>{method.timed ? formatClock(totalTime(method)) : "12–18 hours"}</dd>
        </div>
        <div>
          <dt className="meta">In the cup</dt>
          <dd>
            {method.waterIsYield ? "" : "About "}
            {mass(beverageYield(brew), "water")}
            {method.yieldNote && <span className="spec-note">{method.yieldNote}</span>}
          </dd>
        </div>
      </dl>

      <section aria-labelledby="recipe-title">
        <Staff label="Recipe" />
        <h2 id="recipe-title" className="visually-hidden">
          Recipe and timer
        </h2>
        <Timer
          key={brew.method}
          steps={steps}
          timed={method.timed}
          formatTarget={(g) => mass(g, "water")}
          targetLabel={method.waterIsYield ? "Yield" : "Pour to"}
          sound={prefs.sound}
          onToggleSound={() => setPrefs({ sound: !prefs.sound })}
        />
      </section>

      <section aria-labelledby="saved-title">
        <Staff label="Saved" />
        <div className="section-head">
          <h2 id="saved-title" className="section-title">
            Your recipes
          </h2>
          <span className="meta">Kept in this browser</span>
        </div>
        <form className="save-form" onSubmit={save}>
          <label htmlFor="recipe-name" className="visually-hidden">
            Recipe name
          </label>
          <input
            id="recipe-name"
            className="text-input"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            placeholder={suggestedName}
            maxLength={60}
          />
          <button type="submit" className="button button-primary">
            Save this recipe
          </button>
        </form>
        {recipes.length === 0 ? (
          <p className="note">Nothing saved yet. Dial something in and save it here.</p>
        ) : (
          <ol className="post-list recipes">
            {recipes.map((r) => {
              const m = getMethod(r.method);
              return (
                <li key={r.id} className="recipe-row">
                  <button type="button" className="recipe-load" onClick={() => load(r)}>
                    <span className="meta">{m.short}</span>
                    <span className="post-row-title">{r.name}</span>
                    <span className="meta">
                      {mass(r.coffee, "coffee")} · 1:{formatRatio(r.ratio)} · {mass(r.water, "water")}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="button button-quiet"
                    onClick={() => deleteRecipe(r.id)}
                    aria-label={`Remove ${r.name}`}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function Toggle<T extends string>({
  label,
  options,
  value,
  onChange,
  display = (o) => o,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
  display?: (option: T) => string;
}) {
  return (
    <div className="toggle" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={o === value}
          className="toggle-option"
          onClick={() => onChange(o)}
        >
          {display(o)}
        </button>
      ))}
    </div>
  );
}

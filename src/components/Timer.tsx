"use client";

import { useEffect, useRef, useState } from "react";
import { activeStep, type ScheduledStep } from "@/lib/brew";
import { formatAt, formatClock } from "@/lib/units";

type Props = {
  steps: ScheduledStep[];
  timed: boolean;
  /** Formats a gram target in the current unit, e.g. "192 g" or "36 g each". */
  formatTarget: (grams: number) => string;
  /** What a target means: "Pour to" for filter, "Yield" for espresso. */
  targetLabel: string;
  sound: boolean;
  onToggleSound: () => void;
};

/** A soft two-note chime, so you can keep your eyes on the kettle. */
function chime(ctx: AudioContext) {
  const now = ctx.currentTime;
  [880, 1320].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * 0.12;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.55);
  });
}

export function Timer({ steps, timed, formatTarget, targetLabel, sound, onToggleSound }: Props) {
  // Elapsed time is `banked` seconds plus however long it's been since
  // `startedAt`. Measuring from the clock (rather than counting ticks)
  // keeps it accurate when the tab is in the background.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [banked, setBanked] = useState(0);
  const [now, setNow] = useState(0);
  const audio = useRef<AudioContext | null>(null);
  const lastActive = useRef(-1);

  const running = startedAt !== null;
  const end = steps.at(-1)?.at ?? 0;
  const elapsed = running ? banked + (now - startedAt) / 1000 : banked;
  const current = activeStep(steps, elapsed);
  const finished = elapsed >= end && banked > 0 && !running;

  useEffect(() => {
    if (startedAt === null) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      const seconds = banked + (t - startedAt) / 1000;
      const active = activeStep(steps, seconds);
      if (active !== lastActive.current) {
        lastActive.current = active;
        // No chime for the first step: you just pressed Start.
        if (active > 0 && sound && audio.current) chime(audio.current);
        if (active > 0) navigator.vibrate?.(120);
      }
      if (seconds >= end) {
        setBanked(end);
        setStartedAt(null);
      } else {
        setNow(t);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [startedAt, banked, steps, end, sound]);

  function start() {
    if (sound && !audio.current) {
      // Browsers only allow audio once someone has clicked something.
      try {
        audio.current = new AudioContext();
      } catch {
        audio.current = null;
      }
    }
    void audio.current?.resume();
    const from = finished ? 0 : banked;
    if (from === 0) lastActive.current = 0;
    const t = Date.now();
    setBanked(from);
    setNow(t);
    setStartedAt(t);
  }

  function pause() {
    setBanked(elapsed);
    setStartedAt(null);
  }

  function reset() {
    setStartedAt(null);
    setBanked(0);
    lastActive.current = -1;
  }

  const step = current >= 0 ? steps[current] : null;
  const next = steps[current + 1];
  const started = running || banked > 0;

  return (
    <div className="timer">
      {timed && (
        <div className="timer-head">
          <div className="timer-readout">
            <span className="timer-clock" aria-label={`Elapsed ${formatClock(elapsed)}`}>
              {formatClock(elapsed)}
            </span>
            <span className="meta">of {formatClock(end)}</span>
          </div>
          <div className="timer-now" aria-live="polite">
            {!started && <p className="timer-step">Ready when you are.</p>}
            {started && step && (
              <>
                <p className="timer-step">
                  {finished ? "Done. Enjoy." : step.title}
                  {!finished && step.target !== undefined && (
                    <span className="timer-target"> → {formatTarget(step.target)}</span>
                  )}
                </p>
                {next && !finished && (
                  <p className="meta">
                    Next: {next.title} in {formatClock(next.at - elapsed + 0.999)}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="timer-controls">
            {running ? (
              <button type="button" className="button button-primary" onClick={pause}>
                Pause
              </button>
            ) : (
              <button type="button" className="button button-primary" onClick={start}>
                {finished ? "Again" : started ? "Resume" : "Start"}
              </button>
            )}
            <button type="button" className="button" onClick={reset} disabled={!started}>
              Reset
            </button>
            <button
              type="button"
              className="button button-quiet"
              aria-pressed={sound}
              onClick={onToggleSound}
            >
              Sound {sound ? "on" : "off"}
            </button>
          </div>
        </div>
      )}

      <ol className="steps">
        {steps.map((s, i) => {
          const state = !started || !timed ? "" : i < current || finished ? "is-done" : i === current ? "is-current" : "";
          const progress =
            state === "is-current" && s.duration ? Math.min(1, (elapsed - s.at) / s.duration) : 0;
          return (
            <li key={i} className={`step ${state}`} aria-current={state === "is-current" ? "step" : undefined}>
              <span className="meta step-at">{formatAt(s.at, timed)}</span>
              <span className="step-main">
                <span className="step-title">{s.title}</span>
                {s.detail && <span className="step-detail">{s.detail}</span>}
              </span>
              <span className="step-target">
                {s.target !== undefined && (
                  <>
                    <span className="meta">{targetLabel}</span> {formatTarget(s.target)}
                  </>
                )}
              </span>
              {state === "is-current" && (
                <span className="step-progress" aria-hidden="true">
                  <span style={{ transform: `scaleX(${progress})` }} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {!timed && (
        <p className="note">
          This one takes all night, so there’s no timer. Set a reminder instead.
        </p>
      )}
    </div>
  );
}

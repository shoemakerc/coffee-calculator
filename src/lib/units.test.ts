import { describe, expect, it } from "vitest";
import {
  cToF,
  formatAt,
  formatClock,
  formatMass,
  formatRatio,
  formatTemp,
  fromUnit,
  parseNumber,
  toUnit,
} from "./units";

describe("mass", () => {
  it("round-trips through ounces", () => {
    expect(fromUnit(toUnit(500, "oz"), "oz")).toBeCloseTo(500);
    expect(toUnit(28.349523125, "oz")).toBeCloseTo(1);
  });

  it("shows coffee to a tenth of a gram and water to the gram", () => {
    expect(formatMass(31.25, "g", "coffee")).toBe("31.3");
    expect(formatMass(20, "g", "coffee")).toBe("20");
    expect(formatMass(312.4, "g", "water")).toBe("312");
  });

  it("gives ounces enough decimals to be useful", () => {
    expect(formatMass(20, "oz", "coffee")).toBe("0.71");
    expect(formatMass(320, "oz", "water")).toBe("11.3");
  });
});

describe("temperature", () => {
  it("converts and rounds", () => {
    expect(cToF(100)).toBe(212);
    expect(formatTemp(94, "C")).toBe("94 °C");
    expect(formatTemp(94, "F")).toBe("201 °F");
    expect(formatTemp(null, "F")).toBe("Cold or room temp");
  });
});

describe("time", () => {
  it("formats a clock", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(45.9)).toBe("0:45");
    expect(formatClock(270)).toBe("4:30");
    expect(formatClock(3723)).toBe("1:02:03");
    expect(formatClock(-3)).toBe("0:00");
  });

  it("uses hours for overnight steps", () => {
    expect(formatAt(16 * 3600, false)).toBe("16 h");
    expect(formatAt(90, true)).toBe("1:30");
  });
});

describe("input", () => {
  it("parses what people type", () => {
    expect(parseNumber("20")).toBe(20);
    expect(parseNumber(" 18,5 ")).toBe(18.5);
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
  });

  it("formats ratios without noise", () => {
    expect(formatRatio(16)).toBe("16");
    expect(formatRatio(15.6667)).toBe("15.7");
  });
});

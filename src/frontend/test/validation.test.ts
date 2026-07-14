import { describe, it, expect } from "vitest";
import { canDraw, getEligiblePool, parseItemsText } from "../src/lib/validation";
import type { HistoryEntry, Settings } from "../src/types";

function baseSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    allowRepeat: false,
    unique: true,
    drawCount: 1,
    animationDuration: 3,
    ...overrides
  };
}

describe("parseItemsText", () => {
  it("splits by comma and trims whitespace", () => {
    expect(parseItemsText("Apple, Banana,Cherry ,Durian")).toEqual([
      "Apple",
      "Banana",
      "Cherry",
      "Durian"
    ]);
  });

  it("splits by newline as well", () => {
    expect(parseItemsText("Apple\nBanana\n\nCherry")).toEqual(["Apple", "Banana", "Cherry"]);
  });

  it("drops empty entries", () => {
    expect(parseItemsText("A,,B,")).toEqual(["A", "B"]);
  });
});

describe("getEligiblePool", () => {
  const items = ["Apple", "Banana", "Cherry", "Durian"];

  it("keeps the full roster when allowRepeat=true", () => {
    const history: HistoryEntry[] = [{ round: 1, timestamp: "t", winners: ["Apple"] }];
    expect(getEligiblePool(items, history, true)).toEqual(items);
  });

  it("excludes past winners when allowRepeat=false, without mutating the roster", () => {
    const history: HistoryEntry[] = [{ round: 1, timestamp: "t", winners: ["Apple"] }];
    expect(getEligiblePool(items, history, false)).toEqual(["Banana", "Cherry", "Durian"]);
    expect(items).toEqual(["Apple", "Banana", "Cherry", "Durian"]);
  });
});

describe("canDraw (client-side anti-fraud check)", () => {
  it("disables when the pool is empty", () => {
    expect(canDraw([], baseSettings()).ok).toBe(false);
  });

  it("disables when drawCount exceeds remaining unique items", () => {
    const result = canDraw(
      ["Apple", "Banana", "Cherry", "Durian"],
      baseSettings({ drawCount: 5, unique: true })
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/超過剩餘項目數量/);
  });

  it("allows a valid draw", () => {
    expect(canDraw(["Apple", "Banana", "Cherry", "Durian"], baseSettings({ drawCount: 1 })).ok).toBe(
      true
    );
  });
});

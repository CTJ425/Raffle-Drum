import { describe, it, expect } from "vitest";
import { canDraw, performDraw, generateScrollCandidates, getEligiblePool } from "../src/draw.js";
import type { HistoryEntry, Settings } from "../src/types.js";

function baseSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    allowRepeat: false,
    unique: true,
    drawCount: 1,
    animationDuration: 3,
    ...overrides
  };
}

describe("getEligiblePool", () => {
  const items = ["Tom", "Jerry", "Spike", "Tyke"];

  it("returns the full roster when allowRepeat=true, regardless of history", () => {
    const history: HistoryEntry[] = [{ round: 1, timestamp: "t", winners: ["Tom"] }];
    expect(getEligiblePool(items, history, true)).toEqual(items);
  });

  it("excludes past winners when allowRepeat=false", () => {
    const history: HistoryEntry[] = [{ round: 1, timestamp: "t", winners: ["Tom"] }];
    expect(getEligiblePool(items, history, false)).toEqual(["Jerry", "Spike", "Tyke"]);
  });

  it("returns the full roster when there is no history yet", () => {
    expect(getEligiblePool(items, [], false)).toEqual(items);
  });
});

describe("canDraw", () => {
  it("rejects an empty pool", () => {
    expect(canDraw([], baseSettings()).ok).toBe(false);
  });

  it("rejects drawCount below 1", () => {
    expect(canDraw(["A", "B"], baseSettings({ drawCount: 0 })).ok).toBe(false);
  });

  it("rejects drawCount greater than the pool size when unique", () => {
    const result = canDraw(["A", "B"], baseSettings({ drawCount: 5, unique: true }));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/超過剩餘項目數量/);
  });

  it("allows drawCount greater than pool size when not unique (sampling with replacement)", () => {
    const result = canDraw(["A", "B"], baseSettings({ drawCount: 5, unique: false }));
    expect(result.ok).toBe(true);
  });
});

describe("performDraw", () => {
  it("throws when the draw is invalid", () => {
    expect(() => performDraw([], baseSettings())).toThrow();
  });

  it("draws the requested number of winners", () => {
    const pool = ["Tom", "Jerry", "Spike", "Tyke"];
    const winners = performDraw(pool, baseSettings({ drawCount: 2 }));
    expect(winners).toHaveLength(2);
  });

  it("never repeats a winner within a single round when unique=true", () => {
    const pool = ["Tom", "Jerry", "Spike", "Tyke"];
    for (let i = 0; i < 50; i++) {
      const winners = performDraw(pool, baseSettings({ drawCount: 4, unique: true }));
      expect(new Set(winners).size).toBe(4);
    }
  });

  it("does not mutate the pool it was given", () => {
    const pool = ["Tom", "Jerry", "Spike", "Tyke"];
    const snapshot = [...pool];
    performDraw(pool, baseSettings({ drawCount: 1 }));
    expect(pool).toEqual(snapshot);
  });

  it("produces a roughly uniform distribution of winners over many draws (fairness)", () => {
    const pool = ["A", "B", "C", "D"];
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    const trials = 4000;
    for (let i = 0; i < trials; i++) {
      const winners = performDraw(pool, baseSettings({ drawCount: 1 }));
      counts[winners[0]]++;
    }
    const expected = trials / pool.length;
    for (const item of pool) {
      // Allow +/-20% deviation from the expected uniform share.
      expect(counts[item]).toBeGreaterThan(expected * 0.8);
      expect(counts[item]).toBeLessThan(expected * 1.2);
    }
  });

  it("is deterministic given a seeded rng", () => {
    const pool = ["A", "B", "C", "D"];
    const seq = [0.9, 0.1, 0.5];
    let i = 0;
    const rng = () => seq[i++ % seq.length];
    const winners = performDraw(pool, baseSettings({ drawCount: 3 }), rng);
    expect(winners).toEqual(["C", "B", "A"]);
  });
});

describe("generateScrollCandidates", () => {
  it("returns an empty list for an empty pool", () => {
    expect(generateScrollCandidates([])).toEqual([]);
  });

  it("returns at least the requested minimum length", () => {
    const candidates = generateScrollCandidates(["A", "B"], 10);
    expect(candidates).toHaveLength(10);
    for (const c of candidates) {
      expect(["A", "B"]).toContain(c);
    }
  });
});

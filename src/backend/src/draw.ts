import type { HistoryEntry, Settings } from "./types.js";

export interface DrawCheck {
  ok: boolean;
  reason?: string;
}

function shuffleIndices(n: number, rng: () => number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * `items` is the Host's persistent roster and is never mutated by a draw.
 * When allowRepeat=false, a name that already appears in `history` is no
 * longer eligible; this is recomputed from `items` + `history` on every
 * draw instead of physically removing entries from `items`.
 */
export function getEligiblePool(
  items: string[],
  history: HistoryEntry[],
  allowRepeat: boolean
): string[] {
  if (allowRepeat) return items;
  const alreadyWon = new Set(history.flatMap((h) => h.winners));
  return items.filter((item) => !alreadyWon.has(item));
}

export function canDraw(pool: string[], settings: Settings): DrawCheck {
  if (pool.length === 0) {
    return { ok: false, reason: "已無可抽取的候選項目" };
  }
  if (!Number.isInteger(settings.drawCount) || settings.drawCount < 1) {
    return { ok: false, reason: "單次抽取人數必須至少為 1" };
  }
  if (settings.unique && settings.drawCount > pool.length) {
    return { ok: false, reason: "單次抽取人數超過剩餘項目數量" };
  }
  return { ok: true };
}

/** unique: within one round, winners must be distinct entries (sample without replacement). */
export function performDraw(
  pool: string[],
  settings: Settings,
  rng: () => number = Math.random
): string[] {
  const check = canDraw(pool, settings);
  if (!check.ok) {
    throw new Error(check.reason);
  }

  let winnerIndices: number[];
  if (settings.unique) {
    winnerIndices = shuffleIndices(pool.length, rng).slice(0, settings.drawCount);
  } else {
    winnerIndices = Array.from({ length: settings.drawCount }, () =>
      Math.floor(rng() * pool.length)
    );
  }

  return winnerIndices.map((i) => pool[i]);
}

export function generateScrollCandidates(
  pool: string[],
  minLength = 30,
  rng: () => number = Math.random
): string[] {
  if (pool.length === 0) return [];
  const candidates: string[] = [];
  while (candidates.length < minLength) {
    candidates.push(...shuffle(pool, rng));
  }
  return candidates.slice(0, minLength);
}

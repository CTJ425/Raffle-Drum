import type { HistoryEntry, Settings } from "../types";

export interface DrawCheck {
  ok: boolean;
  reason?: string;
}

/**
 * Mirrors the backend's getEligiblePool(): the Host's roster (`items`) is
 * never mutated by a draw, so eligibility for allowRepeat=false is derived
 * from `items` + `history` every time instead of shrinking the roster.
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

/**
 * Mirrors the backend's canDraw() so the Host UI can disable the button
 * and show a warning before round-tripping to the server.
 */
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

export function parseItemsText(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

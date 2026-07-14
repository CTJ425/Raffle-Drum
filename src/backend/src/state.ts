import fs from "node:fs";
import path from "node:path";
import type { State } from "./types.js";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const STATE_FILE = process.env.STATE_FILE || path.join(DATA_DIR, "state.json");

export function defaultState(): State {
  return {
    items: [],
    settings: {
      allowRepeat: false,
      unique: true,
      drawCount: 1,
      animationDuration: 3
    },
    history: [],
    currentStatus: {
      isDrawing: false,
      startTime: null,
      candidates: []
    }
  };
}

export function loadState(): State {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      ...defaultState(),
      ...parsed,
      settings: { ...defaultState().settings, ...parsed.settings },
      currentStatus: { ...defaultState().currentStatus, ...parsed.currentStatus }
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state: State): void {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("state persistence (API write logic)", () => {
  let tmpDir: string;
  let statePath: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "raffle-state-"));
    statePath = path.join(tmpDir, "state.json");
    process.env.STATE_FILE = statePath;
    process.env.DATA_DIR = tmpDir;
    vi.resetModules();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.STATE_FILE;
    delete process.env.DATA_DIR;
  });

  it("returns default state when no file exists yet", async () => {
    const { loadState } = await import("../src/state.js");
    const state = loadState();
    expect(state.items).toEqual([]);
    expect(state.settings.allowRepeat).toBe(false);
    expect(state.settings.unique).toBe(true);
  });

  it("writes state to disk and reads it back identically", async () => {
    const { loadState, saveState } = await import("../src/state.js");
    const state = loadState();
    state.items = ["UserA", "UserB", "UserC", "UserD"];
    state.history.push({ round: 1, timestamp: new Date().toISOString(), winners: ["UserA"] });
    saveState(state);

    expect(fs.existsSync(statePath)).toBe(true);
    const onDisk = JSON.parse(fs.readFileSync(statePath, "utf-8"));
    expect(onDisk.items).toEqual(["UserA", "UserB", "UserC", "UserD"]);
    expect(onDisk.history).toHaveLength(1);
    expect(onDisk.history[0].winners).toEqual(["UserA"]);

    const reloaded = loadState();
    expect(reloaded.items).toEqual(state.items);
    expect(reloaded.history).toEqual(state.history);
  });

  it("creates the data directory if it does not exist", async () => {
    const nestedDir = path.join(tmpDir, "nested", "data");
    process.env.STATE_FILE = path.join(nestedDir, "state.json");
    vi.resetModules();
    const { loadState, saveState } = await import("../src/state.js");
    saveState(loadState());
    expect(fs.existsSync(path.join(nestedDir, "state.json"))).toBe(true);
  });
});

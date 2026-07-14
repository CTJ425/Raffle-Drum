import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { io as ioClient, type Socket as ClientSocket } from "socket.io-client";
import type { AddressInfo } from "node:net";

function waitForEvent<T = any>(socket: ClientSocket, event: string): Promise<T> {
  return new Promise((resolve) => {
    socket.once(event, (payload: T) => resolve(payload));
  });
}

describe("realtime draw flow (multi-client sync + persistence)", () => {
  let tmpDir: string;
  let baseUrl: string;
  let httpServer: any;
  let clientA: ClientSocket;
  let clientB: ClientSocket;

  beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "raffle-server-"));
    process.env.STATE_FILE = path.join(tmpDir, "state.json");
    process.env.DATA_DIR = tmpDir;

    const { createApp } = await import("../src/server.js");
    const created = createApp();
    httpServer = created.httpServer;

    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const { port } = httpServer.address() as AddressInfo;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    clientA?.close();
    clientB?.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.STATE_FILE;
    delete process.env.DATA_DIR;
  });

  beforeEach(async () => {
    clientA = ioClient(baseUrl, { forceNew: true });
    clientB = ioClient(baseUrl, { forceNew: true });
    await Promise.all([waitForEvent(clientA, "full-state"), waitForEvent(clientB, "full-state")]);
  });

  afterEach(() => {
    clientA.close();
    clientB.close();
  });

  it("syncs item list updates from host to all viewers", async () => {
    const updatePromise = waitForEvent(clientB, "state-updated");
    clientA.emit("update-items", ["Apple", "Banana", "Cherry", "Durian"]);
    const state = await updatePromise;
    expect(state.items).toEqual(["Apple", "Banana", "Cherry", "Durian"]);
  });

  it("broadcasts draw-start to every client simultaneously and persists the winner afterward", async () => {
    clientA.emit("update-items", ["Apple", "Banana", "Cherry", "Durian"]);
    await waitForEvent(clientB, "state-updated");

    clientA.emit("update-settings", { drawCount: 1, animationDuration: 0.05 });
    await waitForEvent(clientB, "state-updated");

    const [startA, startB] = await Promise.all([
      (() => {
        const p = waitForEvent(clientA, "draw-start");
        clientA.emit("draw-request");
        return p;
      })(),
      waitForEvent(clientB, "draw-start")
    ]);

    expect(startA.round).toBe(1);
    expect(startB.round).toBe(1);
    expect(startA.candidates).toEqual(startB.candidates);
    expect(startA.candidates.length).toBeGreaterThan(0);

    const [finalA, finalB] = await Promise.all([
      waitForEvent(clientA, "state-updated"),
      waitForEvent(clientB, "state-updated")
    ]);

    expect(finalA.history).toHaveLength(1);
    expect(finalA.history[0].winners).toHaveLength(1);
    // The Host's roster is never mutated by a draw - it must still show all 4 names.
    expect(finalA.items).toEqual(["Apple", "Banana", "Cherry", "Durian"]);
    expect(finalA).toEqual(finalB);

    const onDisk = JSON.parse(fs.readFileSync(process.env.STATE_FILE as string, "utf-8"));
    expect(onDisk.history).toHaveLength(1);
    expect(onDisk.items).toEqual(["Apple", "Banana", "Cherry", "Durian"]);
  });

  it("excludes a previous round's winner from the eligible pool when allowRepeat=false", async () => {
    clientA.emit("reset");
    await waitForEvent(clientB, "state-updated");
    clientA.emit("update-items", ["Apple", "Banana"]);
    await waitForEvent(clientB, "state-updated");
    clientA.emit("update-settings", {
      drawCount: 1,
      unique: true,
      allowRepeat: false,
      animationDuration: 0.05
    });
    await waitForEvent(clientB, "state-updated");

    clientA.emit("draw-request");
    await waitForEvent(clientA, "draw-start");
    const round1 = await waitForEvent<any>(clientA, "state-updated");
    const firstWinner = round1.history[0].winners[0];
    const remaining = firstWinner === "Apple" ? "Banana" : "Apple";

    // A second single-person draw should now deterministically pick the other name.
    clientA.emit("draw-request");
    await waitForEvent(clientA, "draw-start");
    const round2 = await waitForEvent<any>(clientA, "state-updated");
    expect(round2.history).toHaveLength(2);
    expect(round2.history[1].winners).toEqual([remaining]);
    expect(round2.items).toEqual(["Apple", "Banana"]);
  });

  it("rejects a draw request when drawCount exceeds the remaining unique pool", async () => {
    clientA.emit("update-items", ["A", "B"]);
    await waitForEvent(clientB, "state-updated");
    clientA.emit("update-settings", { drawCount: 5, unique: true });
    await waitForEvent(clientB, "state-updated");

    const errorPromise = waitForEvent(clientA, "draw-error");
    clientA.emit("draw-request");
    const error = await errorPromise;
    expect(error.message).toMatch(/超過剩餘項目數量/);
  });
});

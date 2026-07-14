import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { loadState, saveState, defaultState } from "./state.js";
import { canDraw, performDraw, generateScrollCandidates, getEligiblePool } from "./draw.js";
import type { State, Settings } from "./types.js";

const PORT = Number(process.env.PORT) || 5000;

/**
 * Settings arrive over an unauthenticated socket, so every field must be
 * whitelisted, type-checked, and clamped before it touches persisted state.
 * Returns null when the payload is not an object; unknown/invalid fields
 * are dropped.
 */
export function sanitizeSettings(payload: unknown): Partial<Settings> | null {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return null;
  }
  const raw = payload as Record<string, unknown>;
  const out: Partial<Settings> = {};
  if (typeof raw.allowRepeat === "boolean") out.allowRepeat = raw.allowRepeat;
  if (typeof raw.unique === "boolean") out.unique = raw.unique;
  if (typeof raw.drawCount === "number" && Number.isFinite(raw.drawCount)) {
    out.drawCount = Math.max(1, Math.floor(raw.drawCount));
  }
  if (typeof raw.animationDuration === "number" && Number.isFinite(raw.animationDuration)) {
    out.animationDuration = Math.min(60, Math.max(0.5, raw.animationDuration));
  }
  return out;
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  let state: State = loadState();
  // A restart kills any pending draw timer, so a persisted isDrawing=true can
  // never complete — discard it or every future draw-request gets rejected.
  state.currentStatus = { isDrawing: false, startTime: null, candidates: [] };

  let drawTimer: NodeJS.Timeout | null = null;

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/state", (_req, res) => {
    res.json(state);
  });

  function persistAndBroadcast() {
    saveState(state);
    io.emit("state-updated", state);
  }

  io.on("connection", (socket) => {
    socket.emit("full-state", state);

    socket.on("update-items", (items: unknown) => {
      if (!Array.isArray(items)) return;
      state.items = items.map((i) => String(i).trim()).filter(Boolean);
      persistAndBroadcast();
    });

    socket.on("update-settings", (settings: unknown) => {
      const sanitized = sanitizeSettings(settings);
      if (!sanitized) return;
      state.settings = { ...state.settings, ...sanitized };
      persistAndBroadcast();
    });

    socket.on("reset", () => {
      if (drawTimer) {
        clearTimeout(drawTimer);
        drawTimer = null;
      }
      state = defaultState();
      persistAndBroadcast();
    });

    socket.on("draw-request", () => {
      if (state.currentStatus.isDrawing) {
        socket.emit("draw-error", { message: "抽籤進行中，請稍候" });
        return;
      }

      const pool = getEligiblePool(state.items, state.history, state.settings.allowRepeat);
      const check = canDraw(pool, state.settings);
      if (!check.ok) {
        socket.emit("draw-error", { message: check.reason });
        return;
      }

      const winners = performDraw(pool, state.settings);
      const candidates = generateScrollCandidates(pool);
      const round = state.history.length + 1;
      const durationMs = Math.max(state.settings.animationDuration, 0) * 1000;

      state.currentStatus = {
        isDrawing: true,
        startTime: new Date().toISOString(),
        candidates
      };
      saveState(state);

      io.emit("draw-start", {
        candidates,
        animationDuration: state.settings.animationDuration,
        round
      });

      drawTimer = setTimeout(() => {
        drawTimer = null;
        state.history.push({
          round,
          timestamp: new Date().toISOString(),
          winners
        });
        state.currentStatus = { isDrawing: false, startTime: null, candidates: [] };
        persistAndBroadcast();
        io.emit("draw-result", { round, winners });
      }, durationMs);
    });
  });

  return { app, httpServer, io };
}

if (process.env.NODE_ENV !== "test") {
  const { httpServer } = createApp();
  httpServer.listen(PORT, () => {
    console.log(`Raffle backend listening on port ${PORT}`);
  });
}

import { useCallback, useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import type { DrawStartPayload, Settings, State } from "../types";

export interface WinnerAnnouncement {
  round: number;
  winners: string[];
}

export function useRaffleState() {
  const [state, setState] = useState<State | null>(null);
  const [connected, setConnected] = useState(socket.connected);
  const [isRolling, setIsRolling] = useState(false);
  const [scrollCandidates, setScrollCandidates] = useState<string[]>([]);
  const [animationDuration, setAnimationDuration] = useState(3);
  const [winnerAnnouncement, setWinnerAnnouncement] = useState<WinnerAnnouncement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isRollingRef = useRef(false);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onFullState(s: State) {
      setState(s);
      // Joining (or refreshing) mid-draw: pick up the rolling animation so
      // every screen stays in sync; draw-result will stop it.
      if (s.currentStatus.isDrawing && s.currentStatus.candidates.length > 0) {
        setScrollCandidates(s.currentStatus.candidates);
        isRollingRef.current = true;
        setIsRolling(true);
      } else if (isRollingRef.current) {
        isRollingRef.current = false;
        setIsRolling(false);
      }
    }
    function onStateUpdated(s: State) {
      setState(s);
      // isDrawing only turns false on completion or reset — mid-draw item or
      // settings edits keep it true, so this never stops the animation early.
      if (isRollingRef.current && !s.currentStatus.isDrawing) {
        isRollingRef.current = false;
        setIsRolling(false);
      }
    }
    function onDrawResult(payload: WinnerAnnouncement) {
      isRollingRef.current = false;
      setIsRolling(false);
      setWinnerAnnouncement(payload);
    }
    function onDrawStart(payload: DrawStartPayload) {
      setError(null);
      setWinnerAnnouncement(null);
      setScrollCandidates(payload.candidates);
      setAnimationDuration(payload.animationDuration);
      isRollingRef.current = true;
      setIsRolling(true);
    }
    function onDrawError(payload: { message: string }) {
      setError(payload.message);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("full-state", onFullState);
    socket.on("state-updated", onStateUpdated);
    socket.on("draw-start", onDrawStart);
    socket.on("draw-result", onDrawResult);
    socket.on("draw-error", onDrawError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("full-state", onFullState);
      socket.off("state-updated", onStateUpdated);
      socket.off("draw-start", onDrawStart);
      socket.off("draw-result", onDrawResult);
      socket.off("draw-error", onDrawError);
    };
  }, []);

  const updateItems = useCallback((items: string[]) => {
    socket.emit("update-items", items);
  }, []);

  const updateSettings = useCallback((settings: Partial<Settings>) => {
    socket.emit("update-settings", settings);
  }, []);

  const requestDraw = useCallback(() => {
    socket.emit("draw-request");
  }, []);

  const reset = useCallback(() => {
    socket.emit("reset");
  }, []);

  const dismissWinnerAnnouncement = useCallback(() => setWinnerAnnouncement(null), []);
  const dismissError = useCallback(() => setError(null), []);

  return {
    state,
    connected,
    isRolling,
    scrollCandidates,
    animationDuration,
    winnerAnnouncement,
    error,
    updateItems,
    updateSettings,
    requestDraw,
    reset,
    dismissWinnerAnnouncement,
    dismissError
  };
}

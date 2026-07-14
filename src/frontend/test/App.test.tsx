import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material";
import App from "../src/App";

const mockHook = vi.fn();

vi.mock("../src/hooks/useRaffleState", () => ({
  useRaffleState: () => mockHook()
}));

function baseHookState(overrides: Partial<ReturnType<typeof mockHook>> = {}) {
  return {
    state: {
      items: ["Apple", "Banana", "Cherry", "Durian"],
      settings: { allowRepeat: false, unique: true, drawCount: 1, animationDuration: 3 },
      history: [],
      currentStatus: { isDrawing: false, startTime: null, candidates: [] }
    },
    connected: true,
    isRolling: false,
    scrollCandidates: [],
    animationDuration: 3,
    winnerAnnouncement: null,
    error: null,
    updateItems: vi.fn(),
    updateSettings: vi.fn(),
    requestDraw: vi.fn(),
    reset: vi.fn(),
    dismissWinnerAnnouncement: vi.fn(),
    dismissError: vi.fn(),
    ...overrides
  };
}

function renderApp() {
  return render(
    <ThemeProvider theme={createTheme()}>
      <App />
    </ThemeProvider>
  );
}

describe("App", () => {
  beforeEach(() => {
    mockHook.mockReset();
  });

  it("shows Host controls under ?role=host", () => {
    window.history.pushState({}, "", "/?role=host");
    mockHook.mockReturnValue(baseHookState());
    renderApp();
    expect(screen.getByTestId("start-draw-button")).toBeInTheDocument();
  });

  it("hides Host controls for the default viewer role", () => {
    window.history.pushState({}, "", "/");
    mockHook.mockReturnValue(baseHookState());
    renderApp();
    expect(screen.queryByTestId("start-draw-button")).not.toBeInTheDocument();
  });

  it("disables START DRAW and shows a warning when drawCount exceeds the remaining unique pool", () => {
    window.history.pushState({}, "", "/?role=host");
    mockHook.mockReturnValue(
      baseHookState({
        state: {
          items: ["Apple", "Banana", "Cherry", "Durian"],
          settings: { allowRepeat: false, unique: true, drawCount: 5, animationDuration: 3 },
          history: [],
          currentStatus: { isDrawing: false, startTime: null, candidates: [] }
        }
      })
    );
    renderApp();

    const button = screen.getByTestId("start-draw-button");
    expect(button).toBeDisabled();
    expect(screen.getByTestId("draw-warning")).toHaveTextContent("超過剩餘項目數量");
  });

  it("enables START DRAW for a valid configuration", () => {
    window.history.pushState({}, "", "/?role=host");
    mockHook.mockReturnValue(baseHookState());
    renderApp();

    expect(screen.getByTestId("start-draw-button")).toBeEnabled();
    expect(screen.queryByTestId("draw-warning")).not.toBeInTheDocument();
  });
});

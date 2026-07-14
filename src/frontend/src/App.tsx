import { useMemo } from "react";
import {
  AppBar,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Snackbar,
  Stack,
  Toolbar,
  Typography
} from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import { getRole } from "./lib/role";
import { canDraw, getEligiblePool } from "./lib/validation";
import { useRaffleState } from "./hooks/useRaffleState";
import { ItemsInput } from "./components/ItemsInput";
import { SettingsPanel } from "./components/SettingsPanel";
import { DrumDisplay } from "./components/DrumDisplay";
import { WinnerDialog } from "./components/WinnerDialog";
import { HistoryList } from "./components/HistoryList";

export default function App() {
  const role = useMemo(() => getRole(window.location.search), []);
  const {
    state,
    connected,
    isRolling,
    scrollCandidates,
    winnerAnnouncement,
    error,
    updateItems,
    updateSettings,
    requestDraw,
    reset,
    dismissWinnerAnnouncement,
    dismissError
  } = useRaffleState();

  if (!state) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const pool = getEligiblePool(state.items, state.history, state.settings.allowRepeat);
  const check = canDraw(pool, state.settings);
  const drawDisabled = !check.ok || isRolling || !connected;

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <CasinoIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Raffle Drum 抽籤系統
          </Typography>
          <Chip
            label={role === "host" ? "Host 主持人模式" : "Viewer 觀眾模式"}
            color={role === "host" ? "secondary" : "default"}
            variant="filled"
          />
          {!connected && <Chip sx={{ ml: 1 }} label="連線中斷" color="error" />}
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <DrumDisplay
            items={state.items}
            isRolling={isRolling}
            scrollCandidates={scrollCandidates.length ? scrollCandidates : state.items}
          />

          {role === "host" && (
            <>
              <ItemsInput items={state.items} onChange={updateItems} />
              <SettingsPanel settings={state.settings} onChange={updateSettings} />

              {!check.ok && (
                <Alert severity="warning" data-testid="draw-warning">
                  {check.reason}
                </Alert>
              )}

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  disabled={drawDisabled}
                  onClick={requestDraw}
                  data-testid="start-draw-button"
                >
                  START DRAW
                </Button>
                <Button variant="outlined" size="large" color="secondary" onClick={reset}>
                  RESET
                </Button>
              </Stack>
            </>
          )}

          <HistoryList history={state.history} />
        </Stack>
      </Container>

      <WinnerDialog
        open={!!winnerAnnouncement}
        round={winnerAnnouncement?.round ?? null}
        winners={winnerAnnouncement?.winners ?? []}
        onClose={dismissWinnerAnnouncement}
      />

      <Snackbar open={!!error} autoHideDuration={4000} onClose={dismissError}>
        <Alert severity="error" onClose={dismissError}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

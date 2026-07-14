import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

interface Props {
  open: boolean;
  round: number | null;
  winners: string[];
  onClose: () => void;
}

export function WinnerDialog({ open, round, winners, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    const timer = setTimeout(() => {
      confetti({ particleCount: 80, spread: 120, origin: { y: 0.4 } });
    }, 250);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth data-testid="winner-dialog">
      <DialogTitle sx={{ textAlign: "center" }}>
        <EmojiEventsIcon color="warning" fontSize="large" />
        <Typography variant="h5" fontWeight="bold">
          第 {round} 輪得獎名單
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1} alignItems="center">
          {winners.map((w, i) => (
            <Typography key={`${w}-${i}`} variant="h4" color="primary" fontWeight="bold">
              {w}
            </Typography>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
        <Button variant="contained" onClick={onClose}>
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";

interface Props {
  items: string[];
  isRolling: boolean;
  scrollCandidates: string[];
}

export function DrumDisplay({ items, isRolling, scrollCandidates }: Props) {
  const [displayIndex, setDisplayIndex] = useState(0);

  useEffect(() => {
    if (!isRolling || scrollCandidates.length === 0) return;
    const interval = setInterval(() => {
      setDisplayIndex((i) => (i + 1) % scrollCandidates.length);
    }, 70);
    return () => clearInterval(interval);
  }, [isRolling, scrollCandidates]);

  const rollingText = scrollCandidates.length > 0 ? scrollCandidates[displayIndex % scrollCandidates.length] : "";

  return (
    <Paper
      variant="outlined"
      data-testid="drum-display"
      data-rolling={isRolling}
      sx={{
        p: 4,
        minHeight: 180,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        bgcolor: isRolling ? "action.hover" : "background.paper"
      }}
    >
      {isRolling ? (
        <Typography variant="h2" fontWeight="bold" sx={{ letterSpacing: 2 }}>
          {rollingText}
        </Typography>
      ) : items.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
          {items.map((item, i) => (
            <Typography key={`${item}-${i}`} variant="h6" color="text.secondary">
              {item}
              {i < items.length - 1 ? "、" : ""}
            </Typography>
          ))}
        </Box>
      ) : (
        <Typography variant="h6" color="text.disabled">
          尚未設定候選項目
        </Typography>
      )}
    </Paper>
  );
}

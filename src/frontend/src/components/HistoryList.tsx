import { List, ListItem, ListItemText, Paper, Typography } from "@mui/material";
import type { HistoryEntry } from "../types";

interface Props {
  history: HistoryEntry[];
}

export function HistoryList({ history }: Props) {
  const reversed = [...history].reverse();

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        中獎紀錄
      </Typography>
      {reversed.length === 0 ? (
        <Typography variant="body2" color="text.disabled">
          尚無紀錄
        </Typography>
      ) : (
        <List dense>
          {reversed.map((entry) => (
            <ListItem key={entry.round} divider>
              <ListItemText
                primary={`第 ${entry.round} 輪：${entry.winners.join("、")}`}
                secondary={new Date(entry.timestamp).toLocaleString()}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}

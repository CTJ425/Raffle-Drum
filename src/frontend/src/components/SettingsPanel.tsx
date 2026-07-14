import { FormControlLabel, Paper, Stack, Switch, TextField, Typography } from "@mui/material";
import type { Settings } from "../types";

interface Props {
  settings: Settings;
  onChange: (settings: Partial<Settings>) => void;
}

export function SettingsPanel({ settings, onChange }: Props) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        設定區
      </Typography>
      <Stack spacing={2}>
        <TextField
          label="單次抽取人數"
          type="number"
          size="small"
          inputProps={{ min: 1 }}
          value={settings.drawCount}
          onChange={(e) => onChange({ drawCount: Math.max(1, Number(e.target.value) || 1) })}
        />
        <TextField
          label="動畫秒數"
          type="number"
          size="small"
          inputProps={{ min: 0.5, step: 0.5 }}
          value={settings.animationDuration}
          onChange={(e) =>
            onChange({ animationDuration: Math.max(0.5, Number(e.target.value) || 0.5) })
          }
        />
        <FormControlLabel
          control={
            <Switch
              checked={settings.unique}
              onChange={(e) => onChange({ unique: e.target.checked })}
            />
          }
          label="重複限制（不重複）：單輪抽取不可重複中獎"
        />
        <FormControlLabel
          control={
            <Switch
              checked={settings.allowRepeat}
              onChange={(e) => onChange({ allowRepeat: e.target.checked })}
            />
          }
          label="允許得獎者留在池中（未來輪次可再次中獎）"
        />
      </Stack>
    </Paper>
  );
}

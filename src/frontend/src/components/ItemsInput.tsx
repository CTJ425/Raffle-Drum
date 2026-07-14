import { useState } from "react";
import { Autocomplete, Chip, Paper, TextField, Typography } from "@mui/material";
import { parseItemsText } from "../lib/validation";

interface Props {
  items: string[];
  onChange: (items: string[]) => void;
}

export function ItemsInput({ items, onChange }: Props) {
  const [inputValue, setInputValue] = useState("");

  const commit = (next: string[]) => {
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const raw of next) {
      const name = raw.trim();
      if (name && !seen.has(name)) {
        seen.add(name);
        deduped.push(name);
      }
    }
    onChange(deduped);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        項目輸入框（輸入名稱後按 Enter 或逗號新增標籤）
      </Typography>
      <Autocomplete
        multiple
        freeSolo
        autoSelect
        options={[]}
        value={items}
        inputValue={inputValue}
        onInputChange={(_e, newInput) => {
          if (/[,\n]/.test(newInput)) {
            const parts = parseItemsText(newInput);
            if (parts.length) commit([...items, ...parts]);
            setInputValue("");
          } else {
            setInputValue(newInput);
          }
        }}
        onChange={(_e, newValue) => commit(newValue as string[])}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip label={option} {...getTagProps({ index })} data-testid={`item-tag-${option}`} />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={items.length ? "" : "Tom, Jerry, Spike, Tyke"}
            data-testid="items-input"
          />
        )}
      />
    </Paper>
  );
}

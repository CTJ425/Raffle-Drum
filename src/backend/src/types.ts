export interface Settings {
  allowRepeat: boolean;
  unique: boolean;
  drawCount: number;
  animationDuration: number;
}

export interface HistoryEntry {
  round: number;
  timestamp: string;
  winners: string[];
}

export interface CurrentStatus {
  isDrawing: boolean;
  startTime: string | null;
  candidates: string[];
}

export interface State {
  items: string[];
  settings: Settings;
  history: HistoryEntry[];
  currentStatus: CurrentStatus;
}

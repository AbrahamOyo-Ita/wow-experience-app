export type TimerStatus = "idle" | "running" | "paused" | "completed";
export type TimerSegmentType = "speaker" | "break" | "worship" | "announcement" | "custom";
export type TimerTheme = "dark" | "light" | "high-contrast";

export type TimerDisplayConfig = {
  theme: TimerTheme;
  accent: string;
  fontSize: "lg" | "xl" | "2xl";
  showTitle: boolean;
  showSpeaker: boolean;
  showClock: boolean;
  showProgress: boolean;
  showNext: boolean;
  soundEnabled: boolean;
  warningSeconds: number;
  redSeconds: number;
  warningColor?: string;
  redColor?: string;
  overtimeColor?: string;
  logoUrl?: string;
};

export type TimerSegment = {
  id: string;
  position: number;
  title: string;
  speaker: string;
  durationSeconds: number;
  segmentType: TimerSegmentType;
  notes: string;
  warningSeconds: number;
  autoAdvance: boolean;
  overtimeMode: boolean;
  elapsedSeconds: number;
  adjustmentSeconds: number;
  startedAt: string | null;
};

export type TimerSession = {
  id: string;
  publicCode: string;
  eventName: string;
  status: TimerStatus;
  currentSegmentIndex: number;
  runningStartedAt: string | null;
  blackout: boolean;
  frozen: boolean;
  flashMessage: string | null;
  displayConfig: TimerDisplayConfig;
  updatedAt: string;
  serverNow: string;
  segments: TimerSegment[];
};

export type TimerTemplate = {
  id: string;
  name: string;
  eventName: string;
  segments: Omit<TimerSegment, "id" | "position" | "elapsedSeconds" | "adjustmentSeconds" | "startedAt">[];
  displayConfig: Partial<TimerDisplayConfig>;
};

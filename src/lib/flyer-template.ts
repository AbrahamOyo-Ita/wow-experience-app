import { z } from "zod";

const normalized = z.number().finite().min(0).max(1);

export const flyerPhotoAreaSchema = z.object({
  shape: z.literal("circle"),
  cx: normalized,
  cy: normalized,
  r: z.number().finite().gt(0).max(0.5),
});

export const flyerTextAreaSchema = z.object({
  x: normalized,
  y: normalized,
  w: z.number().finite().gt(0).max(1),
  h: z.number().finite().gt(0).max(1),
  align: z.enum(["left", "center", "right"]),
  fontFamily: z.string().trim().min(1).max(120),
  fontWeight: z.number().int().min(100).max(900).multipleOf(100),
  maxFontSize: z.number().finite().min(8).max(500),
  minFontSize: z.number().finite().min(6).max(500),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Use a six-digit hex color."),
  transform: z.enum(["none", "uppercase", "lowercase"]),
  maxChars: z.number().int().min(1).max(120),
  placeholder: z.string().trim().min(1).max(120),
});

export const flyerTemplateConfigSchema = z.object({
  version: z.literal(1),
  baseWidth: z.number().int().min(320).max(10000),
  baseHeight: z.number().int().min(320).max(10000),
  photoArea: flyerPhotoAreaSchema,
  textArea: flyerTextAreaSchema,
}).superRefine((value, ctx) => {
  const radiusX = value.photoArea.r;
  const radiusY = (value.photoArea.r * value.baseWidth) / value.baseHeight;
  if (value.photoArea.cx - radiusX < 0 || value.photoArea.cx + radiusX > 1 || value.photoArea.cy - radiusY < 0 || value.photoArea.cy + radiusY > 1) {
    ctx.addIssue({ code: "custom", path: ["photoArea"], message: "Photo circle must stay inside the design." });
  }
  if (value.textArea.x + value.textArea.w > 1 || value.textArea.y + value.textArea.h > 1) {
    ctx.addIssue({ code: "custom", path: ["textArea"], message: "Text box must stay inside the design." });
  }
  if (value.textArea.minFontSize > value.textArea.maxFontSize) {
    ctx.addIssue({ code: "custom", path: ["textArea", "minFontSize"], message: "Minimum font size cannot exceed the maximum." });
  }
});

export type FlyerPhotoArea = z.infer<typeof flyerPhotoAreaSchema>;
export type FlyerTextArea = z.infer<typeof flyerTextAreaSchema>;
export type FlyerTemplateConfig = z.infer<typeof flyerTemplateConfigSchema>;

export const DEFAULT_FLYER_CONFIG: FlyerTemplateConfig = {
  version: 1,
  baseWidth: 2000,
  baseHeight: 2500,
  photoArea: { shape: "circle", cx: 0.5035, cy: 0.484, r: 0.278 },
  textArea: { x: 0.18, y: 0.72, w: 0.64, h: 0.055, align: "center", fontFamily: "Manrope, Arial, sans-serif", fontWeight: 800, maxFontSize: 74, minFontSize: 28, color: "#ffffff", transform: "uppercase", maxChars: 40, placeholder: "Put your name here" },
};

export function parseFlyerTemplateConfig(value: unknown) {
  return flyerTemplateConfigSchema.parse(value);
}

export function sanitizeFlyerName(value: string) {
  return value.replace(/[<>\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
}

export function flyerFileSlug(value: string) {
  const slug = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return slug || "guest";
}

export type HistoryState<T> = { past: T[]; present: T; future: T[] };

export function pushHistory<T>(state: HistoryState<T>, next: T, limit = 50): HistoryState<T> {
  if (Object.is(state.present, next)) return state;
  return { past: [...state.past, state.present].slice(-limit), present: next, future: [] };
}

export function undoHistory<T>(state: HistoryState<T>): HistoryState<T> {
  const previous = state.past.at(-1);
  if (previous === undefined) return state;
  return { past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future].slice(0, 50) };
}

export function redoHistory<T>(state: HistoryState<T>): HistoryState<T> {
  const next = state.future[0];
  if (next === undefined) return state;
  return { past: [...state.past, state.present].slice(-50), present: next, future: state.future.slice(1) };
}

import type { FlyerTemplateConfig, FlyerTextArea } from "@/lib/flyer-template";

export type FlyerPhotoTransform = { zoom: number; offsetX: number; offsetY: number };
export type FlyerImageSource = CanvasImageSource & { width: number; height: number };
export type FlyerRenderOptions = {
  template: FlyerImageSource;
  config: FlyerTemplateConfig;
  name: string;
  photo: FlyerImageSource | null;
  photoTransform: FlyerPhotoTransform;
  showGuides?: boolean;
  selectedTool?: "photo" | "text" | null;
};

function transformedText(text: string, transform: FlyerTextArea["transform"]) {
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  return text;
}

export function calculateAutoFitFontSize(
  text: string,
  area: Pick<FlyerTextArea, "minFontSize" | "maxFontSize" | "w" | "h">,
  baseWidth: number,
  baseHeight: number,
  measure: (fontSize: number, value: string) => number,
) {
  const maxWidth = area.w * baseWidth;
  const maxHeight = area.h * baseHeight;
  let low = area.minFontSize;
  let high = Math.min(area.maxFontSize, maxHeight);
  let best = Math.min(low, high);
  for (let index = 0; index < 14; index += 1) {
    const mid = (low + high) / 2;
    if (measure(mid, text) <= maxWidth && mid <= maxHeight) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }
  return Math.max(area.minFontSize, Math.min(best, area.maxFontSize, maxHeight));
}

function drawPhoto(ctx: CanvasRenderingContext2D, options: FlyerRenderOptions) {
  const { config, photo, photoTransform } = options;
  const radius = config.photoArea.r * config.baseWidth;
  const cx = config.photoArea.cx * config.baseWidth;
  const cy = config.photoArea.cy * config.baseHeight;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(1, radius - 2), 0, Math.PI * 2);
  ctx.clip();
  if (!photo) {
    ctx.fillStyle = "#f1f1f1";
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = "#5f5f5f";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.max(24, radius * 0.065)}px Manrope, Arial, sans-serif`;
    ctx.fillText("Tap to add your photo", cx, cy, radius * 1.45);
    ctx.restore();
    return;
  }
  const diameter = radius * 2;
  const scale = Math.max(diameter / photo.width, diameter / photo.height) * photoTransform.zoom;
  const width = photo.width * scale;
  const height = photo.height * scale;
  const availableX = Math.max(0, (width - diameter) / 2);
  const availableY = Math.max(0, (height - diameter) / 2);
  const x = cx - width / 2 + photoTransform.offsetX * availableX;
  const y = cy - height / 2 + photoTransform.offsetY * availableY;
  ctx.drawImage(photo, x, y, width, height);
  ctx.restore();
}

function drawName(ctx: CanvasRenderingContext2D, options: FlyerRenderOptions) {
  const { config } = options;
  const area = config.textArea;
  const raw = options.name.trim() || area.placeholder;
  const text = transformedText(raw.slice(0, area.maxChars), area.transform);
  const fontSize = calculateAutoFitFontSize(text, area, config.baseWidth, config.baseHeight, (size, value) => {
    ctx.font = `${area.fontWeight} ${size}px ${area.fontFamily}`;
    return ctx.measureText(value).width;
  });
  const x = area.x * config.baseWidth;
  const y = area.y * config.baseHeight;
  const width = area.w * config.baseWidth;
  const height = area.h * config.baseHeight;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.font = `${area.fontWeight} ${fontSize}px ${area.fontFamily}`;
  ctx.fillStyle = area.color;
  ctx.textAlign = area.align;
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,.48)";
  ctx.shadowBlur = Math.max(2, fontSize * 0.08);
  const textX = area.align === "left" ? x : area.align === "right" ? x + width : x + width / 2;
  ctx.fillText(text, textX, y + height / 2, width);
  ctx.restore();
}

export function renderFlyer(canvas: HTMLCanvasElement, options: FlyerRenderOptions, pixelRatio = 1) {
  const { config } = options;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas rendering is not available in this browser.");
  canvas.width = config.baseWidth * pixelRatio;
  canvas.height = config.baseHeight * pixelRatio;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, config.baseWidth, config.baseHeight);
  ctx.drawImage(options.template, 0, 0, config.baseWidth, config.baseHeight);
  drawPhoto(ctx, options);
  drawName(ctx, options);
  if (options.showGuides) {
    ctx.save();
    ctx.setLineDash([12, 10]);
    ctx.lineWidth = Math.max(2, config.baseWidth / 500);
    if (!options.selectedTool || options.selectedTool === "photo") {
      ctx.strokeStyle = "#2f7df4";
      ctx.beginPath();
      ctx.arc(config.photoArea.cx * config.baseWidth, config.photoArea.cy * config.baseHeight, config.photoArea.r * config.baseWidth, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (!options.selectedTool || options.selectedTool === "text") {
      ctx.strokeStyle = "#f43f5e";
      ctx.strokeRect(config.textArea.x * config.baseWidth, config.textArea.y * config.baseHeight, config.textArea.w * config.baseWidth, config.textArea.h * config.baseHeight);
    }
    ctx.restore();
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg" = "image/png", quality = 0.95) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not export flyer image."))), type, quality);
  });
}

export type FlyerLayout = "portrait" | "square";
export type FlyerFrameShape = "circle" | "rounded" | "square";
export type FlyerTheme = "classic" | "light";

export type FlyerRenderOptions = {
  layout: FlyerLayout;
  theme: FlyerTheme;
  fullName: string;
  detail: string;
  photo: HTMLImageElement | null;
  templateOverlay: HTMLImageElement | null;
  zoom: number;
  offsetX: number;
  offsetY: number;
  frameShape: FlyerFrameShape;
};

const SIZES: Record<FlyerLayout, { width: number; height: number }> = {
  portrait: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
};

export function getFlyerSize(layout: FlyerLayout) {
  return SIZES[layout];
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fillWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
      continue;
    }
    lines.push(line);
    line = word;
    if (lines.length === maxLines - 1) break;
  }

  if (line && lines.length < maxLines) lines.push(line);

  lines.forEach((row, index) => {
    ctx.fillText(row, x, y + index * lineHeight);
  });

  return lines.length * lineHeight;
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  frame: { x: number; y: number; width: number; height: number },
  shape: FlyerFrameShape,
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  ctx.save();
  if (shape === "circle") {
    ctx.beginPath();
    ctx.ellipse(
      frame.x + frame.width / 2,
      frame.y + frame.height / 2,
      frame.width / 2,
      frame.height / 2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.clip();
  } else if (shape === "rounded") {
    roundRectPath(ctx, frame.x, frame.y, frame.width, frame.height, 46);
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(frame.x, frame.y, frame.width, frame.height);
    ctx.clip();
  }

  const coverScale = Math.max(frame.width / photo.naturalWidth, frame.height / photo.naturalHeight);
  const scale = coverScale * zoom;
  const width = photo.naturalWidth * scale;
  const height = photo.naturalHeight * scale;
  const x = frame.x + (frame.width - width) / 2 + offsetX * frame.width * 0.45;
  const y = frame.y + (frame.height - height) / 2 + offsetY * frame.height * 0.45;

  ctx.drawImage(photo, x, y, width, height);
  ctx.restore();
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, frame: { x: number; y: number; width: number; height: number }) {
  ctx.save();
  roundRectPath(ctx, frame.x, frame.y, frame.width, frame.height, 46);
  ctx.fillStyle = "#f8ecee";
  ctx.fill();
  ctx.strokeStyle = "#c8102e";
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 18]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#8b1524";
  ctx.font = "700 34px Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Upload your photo", frame.x + frame.width / 2, frame.y + frame.height / 2);
  ctx.restore();
}

export function renderFlyer(canvas: HTMLCanvasElement, options: FlyerRenderOptions) {
  const { width, height } = getFlyerSize(options.layout);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = width;
  canvas.height = height;

  const isLight = options.theme === "light";
  ctx.clearRect(0, 0, width, height);

  const background = ctx.createLinearGradient(0, 0, width, height);
  if (isLight) {
    background.addColorStop(0, "#ffffff");
    background.addColorStop(0.6, "#f7f4f4");
    background.addColorStop(1, "#f8ecee");
  } else {
    background.addColorStop(0, "#111111");
    background.addColorStop(0.62, "#24090d");
    background.addColorStop(1, "#8b1524");
  }
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = isLight ? 0.07 : 0.12;
  ctx.fillStyle = isLight ? "#c8102e" : "#ffffff";
  for (let x = -width; x < width * 2; x += 86) {
    ctx.fillRect(x, 0, 2, height);
  }
  for (let y = 0; y < height; y += 86) {
    ctx.fillRect(0, y, width, 2);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = isLight ? 0.12 : 0.22;
  ctx.fillStyle = "#c8102e";
  ctx.beginPath();
  ctx.arc(width * 0.12, height * 0.08, width * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(width * 0.95, height * 0.86, width * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const margin = 78;
  const top = options.layout === "square" ? 84 : 96;
  const photoSize = options.layout === "square" ? 520 : 610;
  const photoFrame = {
    x: (width - photoSize) / 2,
    y: options.layout === "square" ? 164 : 212,
    width: photoSize,
    height: photoSize,
  };

  ctx.save();
  roundRectPath(ctx, margin, top - 34, width - margin * 2, height - top * 1.15, 64);
  ctx.fillStyle = isLight ? "rgba(255,255,255,0.72)" : "rgba(17,17,17,0.42)";
  ctx.fill();
  ctx.strokeStyle = isLight ? "rgba(200,16,46,0.20)" : "rgba(255,255,255,0.16)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = isLight ? "#8b1524" : "#f8ecee";
  ctx.font = "800 31px Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("WONDERS OF WORSHIP EXPERIENCE 2026", width / 2, top + 22);
  ctx.restore();

  ctx.save();
  if (options.photo) {
    drawPhoto(ctx, options.photo, photoFrame, options.frameShape, options.zoom, options.offsetX, options.offsetY);
  } else {
    drawPlaceholder(ctx, photoFrame);
  }
  ctx.strokeStyle = isLight ? "#c8102e" : "#ffffff";
  ctx.lineWidth = 9;
  if (options.frameShape === "circle") {
    ctx.beginPath();
    ctx.ellipse(photoFrame.x + photoFrame.width / 2, photoFrame.y + photoFrame.height / 2, photoFrame.width / 2, photoFrame.height / 2, 0, 0, Math.PI * 2);
  } else if (options.frameShape === "rounded") {
    roundRectPath(ctx, photoFrame.x, photoFrame.y, photoFrame.width, photoFrame.height, 46);
  } else {
    ctx.beginPath();
    ctx.rect(photoFrame.x, photoFrame.y, photoFrame.width, photoFrame.height);
  }
  ctx.stroke();
  ctx.restore();

  const textTop = photoFrame.y + photoFrame.height + (options.layout === "square" ? 72 : 86);
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#c8102e";
  ctx.font = "800 42px Manrope, sans-serif";
  ctx.fillText("I WILL BE ATTENDING", width / 2, textTop);

  ctx.fillStyle = isLight ? "#111111" : "#ffffff";
  ctx.font = `400 ${options.fullName.length > 22 ? 92 : 108}px "Bebas Neue", Impact, sans-serif`;
  fillWrappedText(ctx, options.fullName || "Your Name", width / 2, textTop + 112, width - 180, 96, 2);

  ctx.fillStyle = isLight ? "#5c5555" : "rgba(255,255,255,0.82)";
  ctx.font = "700 32px Manrope, sans-serif";
  fillWrappedText(ctx, options.detail || "Attending from Uyo", width / 2, textTop + 286, width - 220, 44, 2);
  ctx.restore();

  const footerY = height - 172;
  ctx.save();
  ctx.fillStyle = isLight ? "#111111" : "#ffffff";
  ctx.font = "800 34px Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("18 OCTOBER 2026", width / 2, footerY);
  ctx.fillStyle = isLight ? "#5c5555" : "rgba(255,255,255,0.74)";
  ctx.font = "600 25px Manrope, sans-serif";
  ctx.fillText("Sanctified Mount Zion Church, Uyo", width / 2, footerY + 46);
  ctx.fillStyle = "#c8102e";
  ctx.font = "800 26px Manrope, sans-serif";
  ctx.fillText("@WONDEREXPERIENCE", width / 2, footerY + 90);
  ctx.restore();

  if (options.templateOverlay) {
    ctx.drawImage(options.templateOverlay, 0, 0, width, height);
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not export flyer image."));
    }, "image/png", 1);
  });
}

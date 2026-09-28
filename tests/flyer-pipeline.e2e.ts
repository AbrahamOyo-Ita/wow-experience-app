import test from "node:test";
import assert from "node:assert/strict";
import { canvasToBlob, renderFlyer } from "../src/lib/canvas-utils.ts";
import { DEFAULT_FLYER_CONFIG, flyerTemplateConfigSchema } from "../src/lib/flyer-template.ts";

class FakeContext {
  font = ""; fillStyle = ""; strokeStyle = ""; textAlign = "start"; textBaseline = "alphabetic"; shadowColor = ""; shadowBlur = 0; lineWidth = 1;
  drawCalls = 0; textCalls: string[] = [];
  setTransform() {} clearRect() {} save() {} restore() {} beginPath() {} arc() {} clip() {} fillRect() {} rect() {} setLineDash() {} stroke() {} strokeRect() {}
  drawImage() { this.drawCalls += 1; }
  fillText(value: string) { this.textCalls.push(value); }
  measureText(value: string) { const size = Number(this.font.match(/([\d.]+)px/)?.[1] ?? 16); return { width: value.length * size * 0.58 }; }
}

class FakeCanvas {
  width = 0; height = 0; context = new FakeContext();
  getContext() { return this.context; }
  toBlob(callback: (blob: Blob | null) => void, type: string) { callback(new Blob([`${this.width}x${this.height}`], { type })); }
}

test("seed -> edit -> save payload -> public render -> PNG export", async () => {
  const seed = structuredClone(DEFAULT_FLYER_CONFIG);
  const edited = { ...seed, photoArea: { ...seed.photoArea, cx: 0.51 }, textArea: { ...seed.textArea, placeholder: "Put your name here" } };
  const savedJson = JSON.stringify(flyerTemplateConfigSchema.parse(edited));
  const publicConfig = flyerTemplateConfigSchema.parse(JSON.parse(savedJson));
  const canvas = new FakeCanvas();
  renderFlyer(canvas as unknown as HTMLCanvasElement, {
    template: { width: 2000, height: 2500 } as unknown as CanvasImageSource & { width: number; height: number },
    config: publicConfig,
    name: "Iniobong Essien",
    photo: { width: 1200, height: 1600 } as unknown as CanvasImageSource & { width: number; height: number },
    photoTransform: { zoom: 1.2, offsetX: 0.1, offsetY: -0.15 },
  });
  assert.equal(canvas.width, 2000);
  assert.equal(canvas.height, 2500);
  assert.equal(canvas.context.drawCalls, 2);
  assert.ok(canvas.context.textCalls.includes("INIOBONG ESSIEN"));
  const png = await canvasToBlob(canvas as unknown as HTMLCanvasElement);
  assert.equal(png.type, "image/png");
  assert.ok(png.size > 0);
});

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ImagePlus, RefreshCw, Share2, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canvasToBlob, renderFlyer, type FlyerImageSource, type FlyerPhotoTransform } from "@/lib/canvas-utils";
import { decodeFlyerImage, loadFlyerImageUrl } from "@/lib/flyer-images";
import { flyerFileSlug, sanitizeFlyerName } from "@/lib/flyer-template";
import { getPublishedFlyerTemplate, type PublishedFlyerTemplate } from "@/lib/flyer-template-store";

const INITIAL_TRANSFORM: FlyerPhotoTransform = { zoom: 1, offsetX: 0, offsetY: 0 };

export function FlyerGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragOrigin = useRef<{ x: number; y: number; transform: FlyerPhotoTransform } | null>(null);
  const pinchDistance = useRef<number | null>(null);
  const [template, setTemplate] = useState<PublishedFlyerTemplate | null>(null);
  const [templateImage, setTemplateImage] = useState<FlyerImageSource | null>(null);
  const [photo, setPhoto] = useState<FlyerImageSource | null>(null);
  const [photoTransform, setPhotoTransform] = useState(INITIAL_TRANSFORM);
  const [name, setName] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getPublishedFlyerTemplate()
      .then(async (next) => {
        if (!next) { if (!cancelled) setStatus("empty"); return; }
        const image = await loadFlyerImageUrl(next.imageUrl);
        if (!cancelled) { setTemplate(next); setTemplateImage(image); setStatus("ready"); }
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, []);

  const draw = useCallback(() => {
    if (!canvasRef.current || !template || !templateImage) return;
    renderFlyer(canvasRef.current, { template: templateImage, config: template.config, name, photo, photoTransform });
  }, [name, photo, photoTransform, template, templateImage]);

  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => { if (!cancelled) draw(); });
    return () => { cancelled = true; };
  }, [draw]);

  async function choosePhoto(file: File | undefined) {
    if (!file) return;
    setMessage("Preparing your photo…");
    try {
      const decoded = await decodeFlyerImage(file);
      if (photo instanceof ImageBitmap) photo.close();
      setPhoto(decoded);
      setPhotoTransform(INITIAL_TRANSFORM);
      setAdjusting(true);
      setMessage("Drag to reposition. Pinch, scroll, or use the zoom control.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The photo could not be opened.");
    }
  }

  async function exportFlyer(share = false) {
    if (!canvasRef.current || !template) return;
    setExporting(true);
    setMessage("Rendering your high-resolution flyer…");
    try {
      await document.fonts.ready;
      draw();
      const blob = await canvasToBlob(canvasRef.current);
      const filename = `wow-attending-${flyerFileSlug(name)}.png`;
      const file = new File([blob], filename, { type: "image/png" });
      if (share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: template.name, text: "I’m attending!", files: [file] });
        setMessage("Share sheet opened.");
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setMessage(share ? "Sharing is unavailable here, so the flyer was downloaded." : "Flyer downloaded.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") setMessage("Sharing cancelled.");
      else setMessage("The flyer could not be exported. Please try again.");
    } finally { setExporting(false); }
  }

  function pointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!photo || !adjusting) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) dragOrigin.current = { x: event.clientX, y: event.clientY, transform: photoTransform };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchDistance.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  }

  function pointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!pointers.current.has(event.pointerId) || !canvasRef.current) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const values = [...pointers.current.values()];
    if (values.length === 2 && pinchDistance.current) {
      const distance = Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
      const ratio = distance / pinchDistance.current;
      pinchDistance.current = distance;
      setPhotoTransform((current) => ({ ...current, zoom: clamp(current.zoom * ratio, 1, 4) }));
      return;
    }
    const origin = dragOrigin.current;
    if (!origin) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setPhotoTransform({ ...origin.transform, offsetX: clamp(origin.transform.offsetX + ((event.clientX - origin.x) / rect.width) * 3, -1, 1), offsetY: clamp(origin.transform.offsetY + ((event.clientY - origin.y) / rect.height) * 3, -1, 1) });
  }

  function pointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinchDistance.current = null;
    if (pointers.current.size === 0) dragOrigin.current = null;
  }

  if (status === "loading") return <StudioState title="Loading flyer studio" detail="Preparing the published design and its editor settings…" />;
  if (status === "empty") return <StudioState title="Flyer studio is not open yet" detail="The event team has not published an attending flyer." />;
  if (status === "error" || !template) return <StudioState title="Flyer studio could not load" detail="Check your connection and refresh the page." retry />;

  const text = template.config.textArea;
  return (
    <section className="bg-paper py-8 sm:py-14">
      <div className="container-site grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)] xl:items-start">
        <aside className="rounded-2xl border border-border bg-white p-5 xl:sticky xl:top-24">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-red">Attending flyer studio</p>
          <h1 className="mt-2 font-display text-5xl leading-none text-ink">Make it yours</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">Add your photo and name, adjust the crop, then download the exact high-resolution design.</p>

          <div className="mt-6 grid gap-5">
            <div>
              <label className="text-sm font-bold text-ink" htmlFor="attendee-photo">Your photo</label>
              <button type="button" className="mt-2 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-red/45 bg-red-soft px-4 text-sm font-bold text-red-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="h-4 w-4" aria-hidden />{photo ? "Choose another photo" : "Choose a photo"}
              </button>
              <input ref={fileRef} id="attendee-photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" onChange={(event) => void choosePhoto(event.target.files?.[0])} />
            </div>

            <label className="grid gap-2 text-sm font-bold text-ink" htmlFor="attendee-name">
              Your name
              <input id="attendee-name" value={name} maxLength={text.maxChars} placeholder={text.placeholder} onChange={(event) => setName(sanitizeFlyerName(event.target.value))} className="min-h-12 rounded-xl border border-border bg-white px-3 text-base font-medium outline-none focus:border-red focus:ring-2 focus:ring-red/15" />
              <span className="text-right text-xs font-medium text-muted">{name.length}/{text.maxChars}</span>
            </label>

            {photo ? <div className="rounded-xl border border-border bg-paper p-4">
              <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-ink">Photo crop</p><button type="button" className="text-xs font-bold text-red underline-offset-4 hover:underline" onClick={() => setPhotoTransform(INITIAL_TRANSFORM)}><RefreshCw className="mr-1 inline h-3.5 w-3.5" aria-hidden />Reset</button></div>
              <label className="mt-3 grid gap-2 text-xs font-semibold text-muted" htmlFor="photo-zoom"><span className="flex items-center gap-1"><ZoomIn className="h-3.5 w-3.5" aria-hidden /> Zoom</span><input id="photo-zoom" type="range" min="1" max="4" step="0.01" value={photoTransform.zoom} onChange={(event) => setPhotoTransform((value) => ({ ...value, zoom: Number(event.target.value) }))} className="accent-red" /></label>
              <Button type="button" variant="outlineDark" className="mt-4 w-full" onClick={() => { setAdjusting(false); setMessage("Photo crop confirmed."); }}>Done adjusting</Button>
            </div> : null}

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Button type="button" size="lg" disabled={exporting} onClick={() => void exportFlyer(false)}><Download className="mr-2 h-4 w-4" aria-hidden />{exporting ? "Rendering…" : "Download PNG"}</Button>
              <Button type="button" size="lg" variant="outlineDark" disabled={exporting} onClick={() => void exportFlyer(true)}><Share2 className="mr-2 h-4 w-4" aria-hidden />Share</Button>
            </div>
            <p className="min-h-10 rounded-lg bg-paper px-3 py-2 text-xs leading-relaxed text-muted" role="status" aria-live="polite">{message || `${template.config.baseWidth} × ${template.config.baseHeight}px PNG`}</p>
          </div>
        </aside>

        <div className="rounded-2xl border border-border bg-white p-3 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-ink">Live preview</p><p className="text-xs text-muted">Preview and export use the same renderer</p></div>{photo && adjusting ? <span className="rounded-lg bg-red-soft px-2.5 py-1 text-xs font-bold text-red-deep">Drag or pinch photo</span> : null}</div>
          <div className="relative mx-auto max-w-[720px] overflow-hidden rounded-xl bg-ink shadow-[0_24px_70px_rgba(47,15,8,.22)]" style={{ aspectRatio: `${template.config.baseWidth}/${template.config.baseHeight}` }}>
            <canvas ref={canvasRef} className={`h-auto w-full touch-none ${photo && adjusting ? "cursor-grab active:cursor-grabbing" : ""}`} onClick={() => { if (!photo) fileRef.current?.click(); }} onWheel={(event) => { if (!photo || !adjusting) return; event.preventDefault(); setPhotoTransform((value) => ({ ...value, zoom: clamp(value.zoom - event.deltaY * 0.002, 1, 4) })); }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} aria-label="Personalized attending flyer preview" />
            <input aria-label="Name shown on flyer" value={name} maxLength={text.maxChars} placeholder={text.placeholder} onChange={(event) => setName(sanitizeFlyerName(event.target.value))} className="absolute border border-dashed border-white/70 bg-black/10 px-1 text-center text-transparent caret-white outline-none focus:border-white focus:ring-2 focus:ring-white/70" style={{ left: `${text.x * 100}%`, top: `${text.y * 100}%`, width: `${text.w * 100}%`, height: `${text.h * 100}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StudioState({ title, detail, retry = false }: { title: string; detail: string; retry?: boolean }) {
  return <section className="bg-paper py-24"><div className="container-site"><div className="mx-auto max-w-xl rounded-2xl border border-border bg-white p-8 text-center"><h1 className="font-display text-4xl text-ink">{title}</h1><p className="mt-3 text-sm text-muted">{detail}</p>{retry ? <Button type="button" className="mt-6" onClick={() => location.reload()}>Try again</Button> : null}</div></div></section>;
}

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }

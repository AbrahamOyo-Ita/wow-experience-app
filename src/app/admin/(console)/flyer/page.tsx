"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { CircleUserRound, Eye, Redo2, Save, Type, Undo2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { renderFlyer, type FlyerImageSource } from "@/lib/canvas-utils";
import { decodeFlyerImage, loadFlyerImageUrl, validateFlyerImageFile } from "@/lib/flyer-images";
import { DEFAULT_FLYER_CONFIG, flyerTemplateConfigSchema, pushHistory, redoHistory, undoHistory, type FlyerTemplateConfig, type HistoryState } from "@/lib/flyer-template";
import { getAdminFlyerTemplate, savePublishedFlyerTemplate, type PublishedFlyerTemplate } from "@/lib/flyer-template-store";

type Tool = "photo" | "text";
type Action = { type: "set"; value: FlyerTemplateConfig } | { type: "reset"; value: FlyerTemplateConfig } | { type: "undo" } | { type: "redo" };
function historyReducer(state: HistoryState<FlyerTemplateConfig>, action: Action) {
  if (action.type === "set") return pushHistory(state, action.value, 50);
  if (action.type === "undo") return undoHistory(state);
  if (action.type === "redo") return redoHistory(state);
  return { past: [], present: action.value, future: [] };
}

export default function AdminFlyerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ x: number; y: number; config: FlyerTemplateConfig } | null>(null);
  const [history, dispatch] = useReducer(historyReducer, { past: [], present: DEFAULT_FLYER_CONFIG, future: [] });
  const [savedConfig, setSavedConfig] = useState(DEFAULT_FLYER_CONFIG);
  const [asset, setAsset] = useState<PublishedFlyerTemplate | null>(null);
  const [design, setDesign] = useState<FlyerImageSource | null>(null);
  const [designFile, setDesignFile] = useState<File | undefined>();
  const [tool, setTool] = useState<Tool>("photo");
  const [templateName, setTemplateName] = useState("WOW Experience 2026 Attending Flyer");
  const [savedName, setSavedName] = useState(templateName);
  const [testName, setTestName] = useState("Ada Lovelace");
  const [testPhoto, setTestPhoto] = useState<FlyerImageSource | null>(null);
  const [message, setMessage] = useState("Loading the current template…");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const config = history.present;
  const dirty = designFile !== undefined || templateName !== savedName || JSON.stringify(config) !== JSON.stringify(savedConfig);

  const loadAsset = useCallback(async () => {
    setLoading(true);
    try {
      const current = await getAdminFlyerTemplate();
      if (!current) throw new Error("No editable template was found, or this account is not a super admin.");
      const image = await loadFlyerImageUrl(current.imageUrl);
      setAsset(current); setDesign(image); setTemplateName(current.name); setSavedName(current.name);
      setSavedConfig(current.config); dispatch({ type: "reset", value: current.config });
      setDesignFile(undefined); setMessage("Template ready.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The template could not be loaded."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => void loadAsset(), 0);
    return () => window.clearTimeout(task);
  }, [loadAsset]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    const beforeNavigation = (event: MouseEvent) => {
      if (!dirty || event.defaultPrevented || event.button !== 0) return;
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (anchor && !confirm("Leave this page and discard unsaved flyer changes?")) event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", beforeNavigation, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", beforeNavigation, true); };
  }, [dirty]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === "s") { event.preventDefault(); void save(); }
      if (event.key.toLowerCase() === "z") { event.preventDefault(); dispatch({ type: event.shiftKey ? "redo" : "undo" }); }
      if (event.key.toLowerCase() === "y") { event.preventDefault(); dispatch({ type: "redo" }); }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  });

  useEffect(() => {
    if (!canvasRef.current || !design) return;
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled && canvasRef.current) renderFlyer(canvasRef.current, { template: design, config, name: testName, photo: testPhoto, photoTransform: { zoom: 1, offsetX: 0, offsetY: 0 }, showGuides: true, selectedTool: tool });
    });
    return () => { cancelled = true; };
  }, [config, design, testName, testPhoto, tool]);

  async function chooseDesign(file: File | undefined) {
    if (!file) return;
    try {
      validateFlyerImageFile(file);
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("The template design must be a JPG, PNG, or WebP image.");
      if (file.size > 10 * 1024 * 1024) throw new Error("The template design must be smaller than 10 MB.");
      const image = await decodeFlyerImage(file);
      const next = { ...config, baseWidth: image.width, baseHeight: image.height };
      const checked = flyerTemplateConfigSchema.safeParse(next);
      if (!checked.success) throw new Error("The existing geometry does not fit this design. Resize the regions or upload a design with the same aspect ratio.");
      setDesign(image); setDesignFile(file); dispatch({ type: "set", value: checked.data }); setMessage(`${file.name} loaded at ${image.width} × ${image.height}px.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The design could not be loaded."); }
  }

  async function chooseTestPhoto(file: File | undefined) {
    if (!file) return;
    try { setTestPhoto(await decodeFlyerImage(file)); setMessage("Test photo loaded. It will not be saved."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "The test photo could not be loaded."); }
  }

  async function save() {
    if (!dirty || saving) return;
    const checked = flyerTemplateConfigSchema.safeParse(config);
    if (!checked.success) { setMessage(checked.error.issues[0]?.message ?? "Fix the invalid geometry before saving."); return; }
    setSaving(true); setMessage("Saving and publishing…");
    try {
      const next = await savePublishedFlyerTemplate({ name: templateName, file: designFile, storagePath: asset?.storagePath ?? undefined, fileName: asset?.fileName, mimeType: asset?.mimeType, config: checked.data });
      setAsset(next); setDesignFile(undefined); setSavedName(templateName); setSavedConfig(checked.data); dispatch({ type: "reset", value: checked.data }); setMessage("Template saved and published.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The template could not be saved."); }
    finally { setSaving(false); }
  }

  function update(mutator: (value: FlyerTemplateConfig) => FlyerTemplateConfig) {
    const next = mutator(config);
    if (flyerTemplateConfigSchema.safeParse(next).success) dispatch({ type: "set", value: next });
  }

  function pointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, config };
  }
  function pointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const start = dragRef.current;
    if (!start) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = (event.clientX - start.x) / rect.width;
    const dy = (event.clientY - start.y) / rect.height;
    if (tool === "photo") update(() => ({ ...start.config, photoArea: { ...start.config.photoArea, cx: clamp(start.config.photoArea.cx + dx, start.config.photoArea.r, 1 - start.config.photoArea.r), cy: clamp(start.config.photoArea.cy + dy, (start.config.photoArea.r * config.baseWidth) / config.baseHeight, 1 - (start.config.photoArea.r * config.baseWidth) / config.baseHeight) } }));
    else update(() => ({ ...start.config, textArea: { ...start.config.textArea, x: clamp(start.config.textArea.x + dx, 0, 1 - start.config.textArea.w), y: clamp(start.config.textArea.y + dy, 0, 1 - start.config.textArea.h) } }));
  }

  const validation = useMemo(() => flyerTemplateConfigSchema.safeParse(config), [config]);

  return <div className="grid gap-5">
    <PageHeader title="Attending flyer editor" description="Place the attendee photo and name on the native artwork. All geometry is normalized and shared with public export." actions={<Button href="/flyer" variant="outlineDark"><Eye className="mr-2 h-4 w-4" aria-hidden />Public studio</Button>} />
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border border-border bg-white/95 p-3 shadow-sm backdrop-blur">
      <Button type="button" onClick={() => void save()} disabled={!dirty || saving || !validation.success}><Save className="mr-2 h-4 w-4" aria-hidden />{saving ? "Saving…" : "Save & publish"}</Button>
      <Button type="button" variant="outlineDark" disabled={!dirty || saving} onClick={() => { if (confirm("Discard all unsaved flyer changes?")) void loadAsset(); }}><X className="mr-2 h-4 w-4" aria-hidden />Discard</Button>
      <span className="mx-1 h-7 w-px bg-border" aria-hidden />
      <button type="button" className="rounded-lg p-2 text-ink hover:bg-paper disabled:opacity-35" aria-label="Undo" title="Undo (Ctrl/Cmd+Z)" disabled={!history.past.length} onClick={() => dispatch({ type: "undo" })}><Undo2 className="h-4 w-4" /></button>
      <button type="button" className="rounded-lg p-2 text-ink hover:bg-paper disabled:opacity-35" aria-label="Redo" title="Redo (Ctrl/Cmd+Shift+Z)" disabled={!history.future.length} onClick={() => dispatch({ type: "redo" })}><Redo2 className="h-4 w-4" /></button>
      <p className="ml-auto text-xs font-semibold text-muted" role="status">{dirty ? "Unsaved changes" : "All changes saved"} · {message}</p>
    </div>

    <div className="grid gap-5 2xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
      <aside className="grid content-start gap-5 rounded-2xl border border-border bg-white p-4">
        <section><h2 className="text-xs font-bold uppercase tracking-wider text-muted">Tools</h2><div className="mt-2 grid grid-cols-2 gap-2">{([{ id: "photo", label: "Photo", icon: CircleUserRound }, { id: "text", label: "Name", icon: Type }] as const).map((item) => <button key={item.id} type="button" aria-pressed={tool === item.id} onClick={() => setTool(item.id)} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border text-sm font-bold focus-visible:outline-2 focus-visible:outline-red ${tool === item.id ? "border-red bg-red text-white" : "border-border bg-white text-ink hover:bg-paper"}`}><item.icon className="h-4 w-4" aria-hidden />{item.label}</button>)}</div></section>
        <label className="grid gap-2 text-sm font-bold text-ink">Template name<input value={templateName} maxLength={120} onChange={(event) => setTemplateName(event.target.value)} className="min-h-11 rounded-lg border border-border px-3 font-medium outline-none focus:border-red" /></label>
        <div><p className="text-sm font-bold text-ink">Base artwork</p><button type="button" onClick={() => fileRef.current?.click()} className="mt-2 flex min-h-20 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-red/40 bg-red-soft px-3 text-sm font-bold text-red-deep"><Upload className="h-4 w-4" aria-hidden />Upload design</button><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => void chooseDesign(event.target.files?.[0])} /><p className="mt-2 text-xs text-muted">JPG, PNG, or WebP · up to 10 MB</p></div>
        <div><p className="text-sm font-bold text-ink">Live-preview content</p><input aria-label="Test attendee name" value={testName} maxLength={config.textArea.maxChars} onChange={(event) => setTestName(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-border px-3 outline-none focus:border-red" /><label className="mt-2 flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-border text-sm font-bold text-ink hover:bg-paper">Upload test photo<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="sr-only" onChange={(event) => void chooseTestPhoto(event.target.files?.[0])} /></label></div>
      </aside>

      <main className="rounded-2xl border border-border bg-[#171717] p-3 sm:p-6"><div className="mx-auto max-w-[720px]"><canvas ref={canvasRef} className="h-auto w-full cursor-move touch-none bg-white shadow-2xl" style={{ aspectRatio: `${config.baseWidth}/${config.baseHeight}` }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }} aria-label={`Flyer template preview; drag to move the selected ${tool} area`} tabIndex={0} onKeyDown={(event) => { const delta = event.shiftKey ? 0.01 : 0.002; if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); const dx = event.key === "ArrowLeft" ? -delta : event.key === "ArrowRight" ? delta : 0; const dy = event.key === "ArrowUp" ? -delta : event.key === "ArrowDown" ? delta : 0; if (tool === "photo") update((value) => ({ ...value, photoArea: { ...value.photoArea, cx: clamp(value.photoArea.cx + dx, value.photoArea.r, 1 - value.photoArea.r), cy: clamp(value.photoArea.cy + dy, 0, 1) } })); else update((value) => ({ ...value, textArea: { ...value.textArea, x: clamp(value.textArea.x + dx, 0, 1 - value.textArea.w), y: clamp(value.textArea.y + dy, 0, 1 - value.textArea.h) } })); } }} /></div></main>

      <aside className="grid content-start gap-5 rounded-2xl border border-border bg-white p-4">
        <div><h2 className="font-bold text-ink">{tool === "photo" ? "Photo area" : "Name area"}</h2><p className="mt-1 text-xs leading-relaxed text-muted">Drag on the canvas or use these exact normalized controls. Arrow keys move the selected area; hold Shift for larger steps.</p></div>
        {tool === "photo" ? <PhotoControls config={config} update={update} /> : <TextControls config={config} update={update} />}
        {!validation.success ? <p className="rounded-lg border border-red/30 bg-red-soft p-3 text-xs font-semibold text-red-deep" role="alert">{validation.error.issues[0]?.message}</p> : null}
        <div className="border-t border-border pt-4 text-xs text-muted"><p className="font-bold text-ink">Native design</p><p className="mt-1">{config.baseWidth} × {config.baseHeight}px · schema v{config.version}</p><p className="mt-2">Shortcuts: Ctrl/Cmd+S save, Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z redo.</p></div>
      </aside>
    </div>
    {loading ? <div className="fixed inset-0 z-50 grid place-items-center bg-white/70 backdrop-blur-sm"><p className="rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white">Loading editor…</p></div> : null}
  </div>;
}

function Range({ label, value, min, max, step = 0.001, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-muted"><span className="flex justify-between"><span>{label}</span><output>{value.toFixed(3)}</output></span><input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} className="accent-red" /></label>;
}
function PhotoControls({ config, update }: { config: FlyerTemplateConfig; update: (fn: (value: FlyerTemplateConfig) => FlyerTemplateConfig) => void }) {
  const set = (key: "cx" | "cy" | "r", value: number) => update((current) => ({ ...current, photoArea: { ...current.photoArea, [key]: value } }));
  return <div className="grid gap-4"><Range label="Horizontal center" value={config.photoArea.cx} min={config.photoArea.r} max={1 - config.photoArea.r} onChange={(value) => set("cx", value)} /><Range label="Vertical center" value={config.photoArea.cy} min={(config.photoArea.r * config.baseWidth) / config.baseHeight} max={1 - (config.photoArea.r * config.baseWidth) / config.baseHeight} onChange={(value) => set("cy", value)} /><Range label="Radius" value={config.photoArea.r} min={0.05} max={Math.min(config.photoArea.cx, 1 - config.photoArea.cx, 0.48)} onChange={(value) => set("r", value)} /></div>;
}
function TextControls({ config, update }: { config: FlyerTemplateConfig; update: (fn: (value: FlyerTemplateConfig) => FlyerTemplateConfig) => void }) {
  const set = <K extends keyof FlyerTemplateConfig["textArea"]>(key: K, value: FlyerTemplateConfig["textArea"][K]) => update((current) => ({ ...current, textArea: { ...current.textArea, [key]: value } }));
  return <div className="grid gap-4"><Range label="Left" value={config.textArea.x} min={0} max={1 - config.textArea.w} onChange={(value) => set("x", value)} /><Range label="Top" value={config.textArea.y} min={0} max={1 - config.textArea.h} onChange={(value) => set("y", value)} /><Range label="Width" value={config.textArea.w} min={0.1} max={1 - config.textArea.x} onChange={(value) => set("w", value)} /><Range label="Height" value={config.textArea.h} min={0.02} max={1 - config.textArea.y} onChange={(value) => set("h", value)} /><label className="grid gap-1 text-xs font-semibold text-muted">Placeholder<input value={config.textArea.placeholder} maxLength={120} onChange={(event) => set("placeholder", event.target.value)} className="min-h-10 rounded-lg border border-border px-2 text-sm text-ink" /></label><label className="grid gap-1 text-xs font-semibold text-muted">Text color<input type="color" value={config.textArea.color} onChange={(event) => set("color", event.target.value)} className="h-10 w-full rounded-lg border border-border bg-white p-1" /></label><div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-xs font-semibold text-muted">Minimum size<input type="number" min="6" max={config.textArea.maxFontSize} value={config.textArea.minFontSize} onChange={(event) => set("minFontSize", Number(event.target.value))} className="min-h-10 rounded-lg border border-border px-2 text-ink" /></label><label className="grid gap-1 text-xs font-semibold text-muted">Maximum size<input type="number" min={config.textArea.minFontSize} max="500" value={config.textArea.maxFontSize} onChange={(event) => set("maxFontSize", Number(event.target.value))} className="min-h-10 rounded-lg border border-border px-2 text-ink" /></label></div><label className="grid gap-1 text-xs font-semibold text-muted">Alignment<select value={config.textArea.align} onChange={(event) => set("align", event.target.value as "left" | "center" | "right")} className="min-h-10 rounded-lg border border-border px-2 text-sm text-ink"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label></div>;
}
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, ImagePlus, Move, Share2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import {
  canvasToBlob,
  getFlyerSize,
  renderFlyer,
  type FlyerFrameShape,
  type FlyerLayout,
  type FlyerTheme,
} from "@/lib/canvas-utils";
import {
  FLYER_TEMPLATE_UPDATED_EVENT,
  getPublishedFlyerTemplate,
} from "@/lib/flyer-template-store";
import { cn } from "@/lib/utils";

type DragStart = {
  pointerId: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
};

const frameOptions: Array<{ value: FlyerFrameShape; label: string }> = [
  { value: "circle", label: "Circle" },
  { value: "rounded", label: "Rounded" },
  { value: "square", label: "Square" },
];

const layoutOptions: Array<{ value: FlyerLayout; label: string }> = [
  { value: "portrait", label: "4:5" },
  { value: "square", label: "Square" },
];



function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image."));
    };
    image.src = url;
  });
}

export function FlyerGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStartRef = useRef<DragStart | null>(null);
  const [fullName, setFullName] = useState("");
  const [detail, setDetail] = useState("Attending from Uyo");
  const [layout, setLayout] = useState<FlyerLayout>("portrait");
  const [theme, setTheme] = useState<FlyerTheme>("classic");
  const [frameShape, setFrameShape] = useState<FlyerFrameShape>("circle");
  const [zoom, setZoom] = useState(1.08);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [templateOverlay, setTemplateOverlay] = useState<HTMLImageElement | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const outputSize = useMemo(() => getFlyerSize(layout), [layout]);

  useEffect(() => {
    let templateUrl: string | null = null;
    let cancelled = false;

    const loadPublishedTemplate = async () => {
      try {
        const template = await getPublishedFlyerTemplate();
        if (cancelled || !template) return;
        templateUrl = URL.createObjectURL(template.blob);
        const image = new Image();
        image.onload = () => {
          if (!cancelled) {
            setTemplateOverlay(image);
            setNotice(`Published template loaded: ${template.name}`);
          }
        };
        image.src = templateUrl;
      } catch {
        if (!cancelled) setNotice("Published flyer template could not be loaded.");
      }
    };

    const onTemplateUpdated = () => {
      if (templateUrl) URL.revokeObjectURL(templateUrl);
      templateUrl = null;
      void loadPublishedTemplate();
    };

    void loadPublishedTemplate();
    window.addEventListener(FLYER_TEMPLATE_UPDATED_EVENT, onTemplateUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener(FLYER_TEMPLATE_UPDATED_EVENT, onTemplateUpdated);
      if (templateUrl) URL.revokeObjectURL(templateUrl);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (cancelled || !canvasRef.current) return;
      renderFlyer(canvasRef.current, {
        layout,
        theme,
        fullName,
        detail,
        photo,
        templateOverlay,
        zoom,
        offsetX,
        offsetY,
        frameShape,
      });
    };

    if (document.fonts?.ready) {
      void document.fonts.ready.then(draw);
    } else {
      draw();
    }

    return () => {
      cancelled = true;
    };
  }, [detail, frameShape, fullName, layout, offsetX, offsetY, photo, templateOverlay, theme, zoom]);

  const handlePhotoUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setNotice(null);
    try {
      const image = await loadImageFromFile(file);
      setPhoto(image);
      setZoom(1.08);
      setOffsetX(0);
      setOffsetY(0);
    } catch {
      setNotice("That photo could not be loaded. Try another image.");
    }
  };

  const handleTemplateUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    setNotice(null);
    try {
      const image = await loadImageFromFile(file);
      setTemplateOverlay(image);
    } catch {
      setNotice("That template overlay could not be loaded. Try a PNG file.");
    }
  };

  const exportBlob = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Canvas is not ready.");
    return canvasToBlob(canvas);
  }, []);

  const downloadFlyer = async () => {
    setNotice(null);
    try {
      const blob = await exportBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `wow-attending-${layout}.png`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice("Flyer downloaded.");
    } catch {
      setNotice("Could not download the flyer. Please try again.");
    }
  };

  const shareFlyer = async () => {
    setNotice(null);
    try {
      const blob = await exportBlob();
      const file = new File([blob], `wow-attending-${layout}.png`, { type: "image/png" });
      const shareData = {
        title: "Wonders of Worship Experience 2026",
        text: "I will be attending Wonders of Worship Experience 2026.",
        files: [file],
      };

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        setNotice("Share sheet opened.");
        return;
      }

      await downloadFlyer();
    } catch {
      setNotice("Sharing is not available here. Use Download Flyer instead.");
    }
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!photo) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offsetX,
      offsetY,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const start = dragStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const nextX = start.offsetX + (event.clientX - start.x) / rect.width / 0.45;
    const nextY = start.offsetY + (event.clientY - start.y) / rect.height / 0.45;
    setOffsetX(clamp(nextX, -1, 1));
    setOffsetY(clamp(nextY, -1, 1));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const start = dragStartRef.current;
    if (start?.pointerId === event.pointerId) {
      dragStartRef.current = null;
    }
  };

  return (
    <section className="bg-paper py-10 sm:py-16">
      <div className="container-site">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="rounded-3xl border border-border bg-white p-5 shadow-xs sm:p-6 lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-widest text-red">
              Flyer Studio
            </p>
            <h1 className="mt-2 font-display text-5xl font-bold leading-none text-ink sm:text-6xl">
              I&apos;ll Be Attending
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Add your photo and name, then download a branded social flyer.
            </p>

            <div className="mt-6 grid gap-5">
              <Field id="flyer-photo" label="Portrait photo">
                <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-red/40 bg-red-soft px-4 py-3 text-sm font-bold text-red-deep transition hover:bg-white">
                  <ImagePlus className="h-4 w-4" aria-hidden />
                  <span>{photo ? "Change photo" : "Upload photo"}</span>
                  <input
                    id="flyer-photo"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => void handlePhotoUpload(event.target.files)}
                  />
                </label>
              </Field>

              <Field id="flyer-name" label="Full name">
                <TextInput
                  id="flyer-name"
                  value={fullName}
                  placeholder="Minister Grace Davies"
                  maxLength={42}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </Field>

              <Field id="flyer-detail" label="Title or location" optional>
                <TextInput
                  id="flyer-detail"
                  value={detail}
                  placeholder="Attending from Uyo"
                  maxLength={54}
                  onChange={(event) => setDetail(event.target.value)}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <SegmentedControl
                  label="Format"
                  value={layout}
                  options={layoutOptions}
                  onChange={(value) => setLayout(value as FlyerLayout)}
                />
                <SegmentedControl
                  label="Frame"
                  value={frameShape}
                  options={frameOptions}
                  onChange={(value) => setFrameShape(value as FlyerFrameShape)}
                />
              </div>

              <div className="rounded-2xl border border-border bg-paper p-4.5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink">
                  Photo framing
                </p>
                <RangeControl
                  label="Zoom"
                  min={0.75}
                  max={2.25}
                  step={0.01}
                  value={zoom}
                  onChange={setZoom}
                />
                <RangeControl
                  label="Left / Right"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={offsetX}
                  onChange={setOffsetX}
                />
                <RangeControl
                  label="Up / Down"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={offsetY}
                  onChange={setOffsetY}
                />
              </div>

              <Field id="flyer-template" label="Template overlay" optional hint="Upload a transparent PNG frame if the event team provides one.">
                <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-white px-4 py-3 text-sm font-bold text-ink transition hover:border-red/50">
                  <Upload className="h-4 w-4" aria-hidden />
                  <span>{templateOverlay ? "Change overlay" : "Upload overlay PNG"}</span>
                  <input
                    id="flyer-template"
                    type="file"
                    accept="image/png,image/*"
                    className="sr-only"
                    onChange={(event) => void handleTemplateUpload(event.target.files)}
                  />
                </label>
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button type="button" size="lg" className="gap-2" onClick={() => void downloadFlyer()}>
                  <Download className="h-4 w-4" aria-hidden />
                  Download Flyer
                </Button>
                <Button type="button" size="lg" variant="outlineDark" className="gap-2" onClick={() => void shareFlyer()}>
                  <Share2 className="h-4 w-4" aria-hidden />
                  Share
                </Button>
              </div>

              {notice ? (
                <p className="rounded-md bg-paper px-3 py-2 text-sm font-semibold text-ink" role="status">
                  {notice}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-white p-4 shadow-xs sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-ink">Live Preview</p>
                <p className="text-xs text-muted">
                  {outputSize.width} x {outputSize.height}px PNG
                </p>
              </div>
              <p className="rounded-md bg-paper px-3 py-1 text-xs font-bold text-muted">
                Drag photo to adjust
              </p>
            </div>
            <div className="flex justify-center overflow-hidden rounded-2xl bg-ink p-3 sm:p-5">
              <canvas
                ref={canvasRef}
                className={cn(
                  "h-auto max-h-[78vh] w-full max-w-[520px] touch-none rounded-xl bg-white shadow-2xl",
                  photo && "cursor-grab active:cursor-grabbing",
                )}
                style={{ aspectRatio: `${outputSize.width} / ${outputSize.height}` }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                aria-label="Generated attendance flyer preview"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SegmentedControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <div className="flex rounded-xl border border-border bg-paper p-1 shadow-2xs">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "flex-1 rounded-lg py-2 px-2.5 text-center text-xs font-bold transition-all duration-200 active:scale-[0.97]",
                active
                  ? "bg-red text-white shadow-xs"
                  : "bg-transparent text-ink/75 hover:text-ink",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RangeControl({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="mt-3 grid gap-1 text-xs">
      <div className="flex items-center justify-between font-semibold text-muted">
        <span>{label}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-border accent-red"
      />
    </label>
  );
}

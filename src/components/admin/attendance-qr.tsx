"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, ExternalLink, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EventEdition } from "@/types";

const DEFAULT_PROD_URL = "https://wow-experience-app.vercel.app";

function absoluteTarget(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  const base = envUrl && !envUrl.includes("localhost") ? envUrl : DEFAULT_PROD_URL;
  return new URL(path.startsWith("/") ? path : `/${path}`, base).toString();
}

function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadPng(svgString: string, filename: string) {
  const canvas = document.createElement("canvas");
  const size = 1600;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = new window.Image();
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
    }, "image/png");
  };

  img.src = url;
}

let cachedLogoDataUri: string | null = null;

async function getLogoDataUri(): Promise<string> {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  try {
    const res = await fetch("/images/wow-logo-black.webp");
    if (!res.ok) return "";
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogoDataUri = (reader.result as string) || "";
        resolve(cachedLogoDataUri);
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

function injectBrandedLogo(rawSvg: string, logoDataUri: string): string {
  if (!logoDataUri) return rawSvg;

  const vbMatch = rawSvg.match(/viewBox=["']0 0 (\d+) (\d+)["']/);
  if (!vbMatch) return rawSvg;

  const width = parseInt(vbMatch[1], 10);
  const height = parseInt(vbMatch[2], 10);

  // Logo badge size: 24% of matrix width (well within Level H 30% error correction limit)
  const badgeSize = Number((width * 0.24).toFixed(2));
  const badgeX = Number(((width - badgeSize) / 2).toFixed(2));
  const badgeY = Number(((height - badgeSize) / 2).toFixed(2));
  const rx = Number((badgeSize * 0.18).toFixed(2));
  const pad = Number((badgeSize * 0.10).toFixed(2));
  const logoSize = Number((badgeSize - pad * 2).toFixed(2));
  const logoX = Number((badgeX + pad).toFixed(2));
  const logoY = Number((badgeY + pad).toFixed(2));

  const badgeXml = `
  <g id="wow-qr-centerpiece">
    <!-- Solid white protective badge with rounded corners and border -->
    <rect x="${badgeX}" y="${badgeY}" width="${badgeSize}" height="${badgeSize}" rx="${rx}" fill="#ffffff" stroke="#e5e7eb" stroke-width="0.35" />
    <!-- Embedded WOW Experience Brand Logo -->
    <image href="${logoDataUri}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" />
  </g>
`;

  return rawSvg.replace("</svg>", `${badgeXml}</svg>`);
}

export function AttendanceQr({ edition }: { edition: EventEdition }) {
  const [baseSvg, setBaseSvg] = useState("");
  const [logoUri, setLogoUri] = useState("");
  const [withLogo, setWithLogo] = useState(true);
  const [copied, setCopied] = useState(false);

  const targetPath = edition.qrTargetUrl || edition.attendanceUrl || `/attend/${edition.year}`;
  const svgFilename = `wow-attendance-qr-${edition.year}.svg`;
  const pngFilename = `wow-attendance-qr-${edition.year}.png`;

  useEffect(() => {
    let cancelled = false;
    const targetUrl = absoluteTarget(targetPath);

    // Fetch logo data URI for self-contained vector embedding
    getLogoDataUri().then((uri) => {
      if (!cancelled) setLogoUri(uri);
    });

    // Level H (High, 30% error recovery) allows the central logo to be embedded safely
    QRCode.toString(targetUrl, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 2,
      color: {
        dark: "#111111",
        light: "#ffffff",
      },
    })
      .then((code) => {
        if (!cancelled) setBaseSvg(code);
      })
      .catch(() => {
        if (!cancelled) setBaseSvg("");
      });

    return () => {
      cancelled = true;
    };
  }, [targetPath]);

  const activeSvg = useMemo(() => {
    if (!baseSvg) return "";
    if (withLogo && logoUri) {
      return injectBrandedLogo(baseSvg, logoUri);
    }
    return baseSvg;
  }, [baseSvg, withLogo, logoUri]);

  const displayUrl = useMemo(() => {
    const value = activeSvg ? absoluteTarget(targetPath) : targetPath;
    return value.replace(/^https?:\/\//, "");
  }, [activeSvg, targetPath]);

  const copyLink = async () => {
    const targetUrl = absoluteTarget(targetPath);
    await navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(200px,240px)_1fr] md:items-center">
      <div className="relative aspect-square w-full max-w-[240px] overflow-hidden rounded-xl border border-border/80 bg-white p-3 shadow-xs [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-full">
        {activeSvg ? (
          <div
            className="flex h-full w-full items-center justify-center [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-full"
            aria-label={`Branded QR code for ${edition.shortName} attendance check-in`}
            role="img"
            dangerouslySetInnerHTML={{ __html: activeSvg }}
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted">Generating QR…</div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Door check-in QR</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.68rem] font-semibold text-emerald-700 border border-emerald-200">
            <ShieldCheck size={11} aria-hidden />
            Level H · 30% Redundancy
          </span>
        </div>

        <h2 className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-ink">
          {edition.shortName} attendance
        </h2>
        <p className="mt-1 break-all text-sm text-muted font-mono">{displayUrl}</p>

        {/* Logo Toggle */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setWithLogo(!withLogo)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors border",
              withLogo
                ? "bg-red/10 text-red border-red/30 hover:bg-red/20"
                : "bg-paper text-muted border-border hover:bg-paper/80"
            )}
          >
            <ShieldCheck size={13} className={withLogo ? "text-red" : "text-muted"} />
            <span>{withLogo ? "Branded with WOW Logo (Active)" : "Plain QR Matrix"}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outlineDark"
            className="gap-2 text-xs"
            disabled={!activeSvg}
            onClick={() => downloadText(svgFilename, activeSvg, "image/svg+xml")}
          >
            <Download size={14} aria-hidden />
            Download SVG
          </Button>
          <Button
            type="button"
            variant="outlineDark"
            className="gap-2 text-xs"
            disabled={!activeSvg}
            onClick={() => downloadPng(activeSvg, pngFilename)}
          >
            <Download size={14} aria-hidden />
            Download PNG (1600px)
          </Button>
          <Button type="button" variant="ghost" className="gap-2 text-xs" onClick={copyLink}>
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} aria-hidden />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button href={targetPath} variant="ghost" className="gap-2 text-xs">
            <ExternalLink size={14} aria-hidden />
            Open form
          </Button>
        </div>
      </div>
    </div>
  );
}

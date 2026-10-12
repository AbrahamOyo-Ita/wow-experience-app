"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

const LIVE_PROD_URL = "https://www.wowexperience.com.ng";

function absoluteTarget(path: string) {
  if (typeof window !== "undefined" && window.location.origin.includes("wowexperience.com.ng")) {
    return new URL(path, window.location.origin).toString();
  }
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  const base = envUrl && !envUrl.includes("localhost") && !envUrl.includes("vercel.app") ? envUrl : LIVE_PROD_URL;
  return new URL(path, base).toString();
}

function downloadText(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadPng(svg: string, prefix: string) {
  const size = 1600;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const image = new window.Image();
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  image.onload = () => {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(image, 0, 0, size, size);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `${prefix}-1600px.png`;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
    }, "image/png");
  };
  image.src = url;
}

let logoDataUri: string | null = null;
async function getLogo() {
  if (logoDataUri) return logoDataUri;
  try {
    const response = await fetch("/images/wow-logo-black.webp");
    if (!response.ok) return "";
    const reader = new FileReader();
    const result = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve((reader.result as string) || "");
      reader.onerror = () => resolve("");
      response.blob().then((blob) => reader.readAsDataURL(blob));
    });
    logoDataUri = result;
    return result;
  } catch {
    return "";
  }
}

function brandSvg(svg: string, logo: string) {
  if (!logo) return svg;
  const match = svg.match(/viewBox=["']0 0 (\d+) (\d+)["']/);
  if (!match) return svg;
  const size = Number(match[1]) * 0.22;
  const x = (Number(match[1]) - size) / 2;
  const y = (Number(match[2]) - size) / 2;
  const pad = size * 0.1;
  return svg.replace("</svg>", `<g id="wow-qr-centerpiece"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.16}" fill="#fff" stroke="#e5e7eb" stroke-width="0.35"/><image href="${logo}" x="${x + pad}" y="${y + pad}" width="${size - pad * 2}" height="${size - pad * 2}" preserveAspectRatio="xMidYMid meet"/></g></svg>`);
}

export function PrayerQrDownload({ targetPath = "/prayer", label = "Scan to share", downloadPrefix = "wow-prayer-backdrop-qr" }: { targetPath?: string; label?: string; downloadPrefix?: string }) {
  const [svg, setSvg] = useState("");
  const [logo, setLogo] = useState("");
  const [copied, setCopied] = useState(false);
  const target = useMemo(() => absoluteTarget(targetPath), [targetPath]);

  useEffect(() => {
    let cancelled = false;
    getLogo().then((value) => !cancelled && setLogo(value));
    QRCode.toString(target, { type: "svg", errorCorrectionLevel: "H", margin: 4, color: { dark: "#111111", light: "#ffffff" } })
      .then((value) => !cancelled && setSvg(value))
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [target]);

  const brandedSvg = useMemo(() => brandSvg(svg, logo), [svg, logo]);
  const copy = async () => {
    await navigator.clipboard.writeText(target);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mt-4 max-w-[310px]">
      <div className="rounded-2xl bg-white p-3 shadow-[0_18px_55px_rgba(17,17,17,0.2)]">
        <div className="aspect-square w-full [&_svg]:h-full [&_svg]:w-full" role="img" aria-label="Custom WOW prayer QR code" dangerouslySetInnerHTML={{ __html: brandedSvg }} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-semibold text-white/75">
        <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-red-soft" />Backdrop-ready · Level H</span>
        <span>{label}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="h-8 gap-1.5 border-white/35 bg-white/10 px-2.5 text-[11px] text-white hover:bg-white/20" disabled={!brandedSvg} onClick={() => downloadText(`${downloadPrefix}.svg`, brandedSvg, "image/svg+xml")}><Download className="h-3.5 w-3.5" />SVG</Button>
        <Button type="button" variant="outline" className="h-8 gap-1.5 border-white/35 bg-white/10 px-2.5 text-[11px] text-white hover:bg-white/20" disabled={!brandedSvg} onClick={() => downloadPng(brandedSvg, downloadPrefix)}><Download className="h-3.5 w-3.5" />PNG 1600px</Button>
        <Button type="button" variant="ghost" className="h-8 gap-1.5 px-2.5 text-[11px] text-white/80 hover:bg-white/10 hover:text-white" onClick={copy}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy link"}</Button>
      </div>
    </div>
  );
}

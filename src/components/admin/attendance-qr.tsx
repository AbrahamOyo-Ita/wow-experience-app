"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Download, ExternalLink } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
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

export function AttendanceQr({ edition }: { edition: EventEdition }) {
  const [svg, setSvg] = useState("");
  const [copied, setCopied] = useState(false);

  const targetPath = edition.qrTargetUrl || edition.attendanceUrl || `/attend/${edition.year}`;
  const filename = `wow-attendance-qr-${edition.year}.svg`;

  useEffect(() => {
    let cancelled = false;
    const targetUrl = absoluteTarget(targetPath);

    QRCode.toString(targetUrl, {
      type: "svg",
      margin: 1,
      color: {
        dark: "#111111",
        light: "#ffffff",
      },
    })
      .then((code) => {
        if (!cancelled) setSvg(code);
      })
      .catch(() => {
        if (!cancelled) setSvg("");
      });

    return () => {
      cancelled = true;
    };
  }, [targetPath]);

  const displayUrl = useMemo(() => {
    const value = svg ? absoluteTarget(targetPath) : targetPath;
    return value.replace(/^https?:\/\//, "");
  }, [svg, targetPath]);

  const copyLink = async () => {
    const targetUrl = absoluteTarget(targetPath);
    await navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(180px,220px)_1fr] md:items-center">
      <div className="aspect-square w-full max-w-[220px] overflow-hidden rounded-lg border border-border bg-white p-2.5 shadow-sm [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-full">
        {svg ? (
          <div
            className="flex h-full w-full items-center justify-center [&_svg]:h-auto [&_svg]:w-full [&_svg]:max-w-full"
            aria-label={`QR code for ${edition.shortName} attendance check-in`}
            role="img"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted">Generating QR</div>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Door check-in QR</p>
        <h2 className="mt-1 font-display text-xl font-bold text-ink">{edition.shortName} attendance</h2>
        <p className="mt-2 break-all text-sm text-muted">{displayUrl}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outlineDark"
            className="gap-2"
            disabled={!svg}
            onClick={() => downloadText(filename, svg, "image/svg+xml")}
          >
            <Download size={16} aria-hidden />
            Download SVG
          </Button>
          <Button type="button" variant="ghost" className="gap-2" onClick={copyLink}>
            <Copy size={16} aria-hidden />
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button href={targetPath} variant="ghost" className="gap-2">
            <ExternalLink size={16} aria-hidden />
            Open form
          </Button>
        </div>
      </div>
    </div>
  );
}

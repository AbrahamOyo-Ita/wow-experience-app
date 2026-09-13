"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Check, MessageCircle } from "lucide-react";
import { SITE } from "@/data/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const priceFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: SITE.polo.currency,
  maximumFractionDigits: 0,
});

function normalizePhoneNumber(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}

function getAbsoluteImageUrl(imageSrc: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wow-experience-app.vercel.app";
  return new URL(imageSrc, appUrl).toString();
}

export function PoloDetails() {
  const [selectedColor, setSelectedColor] = useState(SITE.polo.colors[0]);
  const [selectedSize, setSelectedSize] = useState(SITE.polo.sizes[1]);

  const selectedSizeIndex = SITE.polo.sizes.findIndex((size) => size === selectedSize);
  const sizeProgress =
    SITE.polo.sizes.length > 1
      ? (selectedSizeIndex / (SITE.polo.sizes.length - 1)) * 100
      : 0;

  const whatsappHref = useMemo(() => {
    const imageUrl = getAbsoluteImageUrl(selectedColor.imageSrc);
    const message = `Hi, I would like to make payment for Wonders of Worship Experience polo ${selectedColor.name} color. Size: ${selectedSize}. Image: ${imageUrl}`;
    const phone = normalizePhoneNumber(SITE.whatsappNumber);
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }, [selectedColor.imageSrc, selectedColor.name, selectedSize]);

  return (
    <section className="bg-paper py-10 sm:py-16">
      <div className="container-site grid gap-8 lg:grid-cols-2 lg:items-stretch">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-white p-4 shadow-xs sm:p-6">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-white">
            <Image
              key={selectedColor.imageSrc}
              src={selectedColor.imageSrc}
              alt={`${SITE.polo.name} in ${selectedColor.name}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 52vw"
              className="object-contain p-4 transition duration-500 sm:p-7"
            />
          </div>
        </div>

        <div className="flex rounded-3xl border border-border bg-white p-6 shadow-xs sm:p-8">
          <div className="flex w-full flex-col justify-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-red">
                Official Polo
              </p>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <h1 className="font-display text-5xl font-bold leading-none text-ink sm:text-7xl">
                  WOW T-Shirt
                </h1>
                <p className="font-display text-4xl font-bold leading-none text-red sm:text-6xl">
                  {priceFormatter.format(SITE.polo.price)}
                </p>
              </div>
            </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-bold text-ink">Color</p>
              <p className="text-sm font-semibold text-muted">{selectedColor.name}</p>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
            {SITE.polo.colors.map((color) => {
              const active = color.slug === selectedColor.slug;
              return (
                <button
                  type="button"
                  key={color.slug}
                  onClick={() => setSelectedColor(color)}
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-12 items-center justify-center gap-2 rounded-full border px-3 text-sm font-bold transition active:scale-[0.98]",
                    active
                      ? "border-red bg-red text-white"
                      : "border-border bg-white text-ink hover:border-red/60",
                  )}
                >
                  <span
                    className={cn(
                      "h-3.5 w-3.5 rounded-full border",
                      active ? "border-white/60" : "border-ink/15",
                      color.swatchClass,
                    )}
                    aria-hidden
                  />
                  <span className="hidden sm:inline">{color.name}</span>
                </button>
              );
            })}
          </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-bold text-ink">Size</p>
              <p className="text-sm font-semibold text-muted">
                {selectedSize}
              </p>
            </div>

            <div className="mt-3 rounded-3xl border border-border bg-paper p-4">
              <div className="relative h-11">
                <div className="absolute left-4 right-4 top-1/2 h-2 -translate-y-1/2 rounded-full bg-white shadow-inner" />
                <div
                  className="absolute left-4 top-1/2 h-2 -translate-y-1/2 rounded-full bg-red transition-all duration-300"
                  style={{ width: `calc((100% - 2rem) * ${sizeProgress / 100})` }}
                />
                <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
                  {SITE.polo.sizes.map((size) => {
                    const active = size === selectedSize;
                    const reached = SITE.polo.sizes.indexOf(size) <= selectedSizeIndex;
                    return (
                      <button
                        type="button"
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        aria-label={`Select ${size}`}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition active:scale-[0.96]",
                          active
                            ? "border-red bg-red text-white shadow-md"
                            : reached
                              ? "border-red bg-white text-red"
                              : "border-border bg-white text-muted hover:border-red/60 hover:text-red",
                        )}
                      >
                        {active ? <Check className="h-4 w-4" aria-hidden /> : size.charAt(0)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[0.66rem] font-bold uppercase tracking-wider text-muted sm:gap-2">
                {SITE.polo.sizes.map((size) => (
                  <button
                    type="button"
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "rounded-full px-1.5 py-1 transition hover:text-red",
                      size === selectedSize && "bg-white text-red shadow-2xs",
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            href={whatsappHref}
            size="lg"
            className="mt-8 w-full gap-2 text-base"
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
            Order on WhatsApp
          </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

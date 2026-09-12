"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { SiteHeader } from "@/components/site/header";
import { OpenRsvpButton } from "@/components/rsvp/open-button";
import { FadeIn, SlideUp, HoverCard, AnimatedHighlight } from "@/components/ui/motion";

const HERO_IMAGES = [
  "/images/IMG_2311.jpg",
  "/images/IMG_2391.jpg",
  "/images/IMG_2431 1.jpg",
  "/images/IMG_2495.jpg",
  "/images/IMG_2581.jpg",
  "/images/IMG_2583.jpg",
  "/images/IMG_2596.jpg",
];

export function HomeHero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % HERO_IMAGES.length);
    }, 5500);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-ink text-white">
      {/* Background Image Carousel with Ken Burns Zoom & Smooth Cross-fade */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: index % 2 === 0 ? 1.12 : 1.04 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.4, ease: "easeInOut" },
            scale: { duration: 6, ease: "linear" },
          }}
          className="absolute inset-0 h-full w-full"
        >
          <Image
            src={HERO_IMAGES[index]}
            alt="Congregation gathered in worship"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark Vignette Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/60 to-ink/90 pointer-events-none" />

      {/* Header Navigation */}
      <SiteHeader inverted />
      
      {/* Hero Content */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col justify-between px-4 pt-24 pb-8">
        <div />
        
        <div className="mx-auto max-w-4xl text-center my-auto">
          <SlideUp delay={0.15} duration={0.7}>
            <h1 className="font-display text-[2.85rem] leading-[0.95] sm:text-7xl lg:text-8xl tracking-tight font-bold">
              Where Worship Becomes an{" "}
              <AnimatedHighlight className="text-red">Encounter.</AnimatedHighlight>
            </h1>
          </SlideUp>

          <FadeIn delay={0.3}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg font-light">
              A generation gathering with one desire: to worship deeply, experience God&apos;s presence, and encounter Him beyond the ordinary.
            </p>
          </FadeIn>

          <FadeIn delay={0.45}>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <HoverCard lift={-3} scale={1.03}>
                <OpenRsvpButton variant="inverse">Reserve your space</OpenRsvpButton>
              </HoverCard>
              <HoverCard lift={-2} scale={1.02}>
                <Link
                  href="/experiences"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:border-white hover:bg-white/15"
                >
                  Explore all editions
                </Link>
              </HoverCard>
            </div>
          </FadeIn>
        </div>

        {/* Carousel Indicators */}
        <div className="mx-auto flex items-center gap-2 pt-6">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index ? "w-8 bg-red" : "w-2 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function PurposeBand() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-28">
      <div className="container-narrow text-center">
        <FadeIn>
          <span className="text-xs font-bold uppercase tracking-widest text-red">
            Our Purpose
          </span>
          <h2 className="mt-3 font-display text-4xl leading-tight sm:text-6xl text-ink font-bold">
            Awakening a Generation <br className="hidden sm:inline" />
            <AnimatedHighlight className="text-red">Through Worship</AnimatedHighlight>
          </h2>
        </FadeIn>
        
        <SlideUp delay={0.2}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted font-light">
            WOW Experience exists to awaken hearts, stir a hunger for God, and create an atmosphere where a generation can encounter His presence. We believe worship can transform lives, unite hearts, and ignite a fire that continues long after the final song.
          </p>
        </SlideUp>
      </div>
    </section>
  );
}

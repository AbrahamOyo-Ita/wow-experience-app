"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpenRsvpButton } from "@/components/rsvp/open-button";
import { Field, PhoneField, TextInput } from "@/components/ui/field";
import { rsvpService } from "@/services";
import { getCurrentEdition } from "@/data/editions";
import { downloadIcs } from "@/lib/calendar";
import { formatLongDate } from "@/lib/utils";
import { flattenZodErrors, rsvpSchema } from "@/lib/validation";
import type { Channel } from "@/types";

const DISMISS_KEY = "wow_rsvp_dismissed_until";
const SUCCESS_KEY = "wow_rsvp_done_2026";

function shouldBlockPath(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/attend") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/unsubscribe")
  );
}

type Step = "decision" | "form" | "success" | "existing";

export function RsvpModal({ pathname }: { pathname: string }) {
  const edition = getCurrentEdition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("decision");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [emailConsent, setEmailConsent] = useState(false);

  const dateLabel = `${formatLongDate(edition.startsAt, edition.timezone)}${
    edition.isDatePlaceholder ? " (placeholder)" : ""
  }`;

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ step?: Step }>).detail;
      setStep(detail?.step === "form" ? "form" : "decision");
      setOpen(true);
    };
    window.addEventListener("wow:open-rsvp", onOpen);
    return () => window.removeEventListener("wow:open-rsvp", onOpen);
  }, []);

  useEffect(() => {
    if (shouldBlockPath(pathname)) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(SUCCESS_KEY)) return;
    const until = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
    if (until && Date.now() < until) return;

    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setOpen(true);
    };

    const timer = window.setTimeout(show, 3000);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= 0.25) show();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open) {
      if (!node.open) node.showModal();
    } else if (node.open) {
      node.close();
    }
  }, [open]);

  const dismiss = (days = 7) => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 864e5));
    setOpen(false);
  };

  const decline = () => {
    dismiss(7);
  };

  const submit = async () => {
    setFormError(null);
    const parsed = rsvpSchema.safeParse({
      firstName,
      phone,
      email,
      preferredChannel: channel,
      whatsappConsent,
      emailConsent,
    });
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);
    const result = await rsvpService.submit({
      firstName,
      phone,
      email,
      preferredChannel: channel,
      whatsappConsent,
      emailConsent,
      editionId: edition.id,
    });
    setSubmitting(false);
    if (result.status === "validation_error" || result.status === "validation") {
      setErrors(Object.fromEntries(result.errors.map((row) => [row.field, row.message])));
      return;
    }
    if (result.status === "offline" || result.status === "error") {
      setFormError(result.message);
      return;
    }
    window.localStorage.setItem(SUCCESS_KEY, "1");
    setStep(result.status === "existing" ? "existing" : "success");
  };

  if (shouldBlockPath(pathname)) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border/80 bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/70 backdrop:backdrop-blur-xs"
      style={{
        position: "fixed",
        inset: 0,
        margin: "auto",
        maxHeight: "90vh",
        width: "min(32rem, calc(100vw - 2rem))",
      }}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) dismiss();
      }}
      aria-labelledby="rsvp-title"
    >
      <div className="relative px-6 py-7 sm:px-8">
        <button
          type="button"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border"
          onClick={() => dismiss()}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {step === "decision" ? (
          <div>
            <p className="text-sm font-semibold text-red">Upcoming event</p>
            <h2 id="rsvp-title" className="mt-3 font-display text-3xl font-bold">
              Wonders of Worship Experience 2026
            </h2>
            <p className="mt-3 text-muted">{dateLabel}</p>
            <p className="mt-2 text-sm text-muted">
              {edition.venue.name}
              {edition.isVenuePlaceholder ? ". Venue to be announced." : null}
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Button type="button" onClick={() => setStep("form")}>
                I&apos;ll be attending
              </Button>
              <Button type="button" variant="ghost" onClick={decline}>
                I won&apos;t be attending
              </Button>
            </div>
          </div>
        ) : null}

        {step === "form" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            noValidate
          >
            <h2 id="rsvp-title" className="font-display text-3xl font-bold">
              Send me reminders
            </h2>
            <p className="mt-2 text-sm text-muted">
              We will only use this information for event reminders on the
              channels you approve.
            </p>
            {formError ? (
              <p className="mt-4 rounded-md bg-red-soft px-3 py-2 text-sm text-red-deep" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="mt-6 grid gap-5">
              <Field id="rsvp-name" label="First name" error={errors.firstName}>
                <TextInput
                  id="rsvp-name"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  error={errors.firstName}
                />
              </Field>
              <Field
                id="rsvp-phone"
                label="WhatsApp number"
                hint="Nigeria numbers can start with 0 or +234."
                error={errors.phone}
              >
                <PhoneField
                  id="rsvp-phone"
                  value={phone}
                  onChange={setPhone}
                  error={errors.phone}
                />
              </Field>
              <Field id="rsvp-email" label="Email address" optional error={errors.email}>
                <TextInput
                  id="rsvp-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  error={errors.email}
                />
              </Field>
              <fieldset>
                <legend className="text-sm font-semibold">Preferred reminder</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {(["whatsapp", "email", "both"] as Channel[]).map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm capitalize"
                    >
                      <input
                        type="radio"
                        name="channel"
                        checked={channel === option}
                        onChange={() => {
                          setChannel(option);
                          setWhatsappConsent(option !== "email");
                          setEmailConsent(option !== "whatsapp");
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </fieldset>
              {channel !== "email" ? (
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={whatsappConsent}
                    onChange={(event) => setWhatsappConsent(event.target.checked)}
                  />
                  <span>
                    I agree to receive event reminders on WhatsApp.
                    {errors.whatsappConsent ? (
                      <span className="mt-1 block text-red">{errors.whatsappConsent}</span>
                    ) : null}
                  </span>
                </label>
              ) : null}
              {channel !== "whatsapp" ? (
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={emailConsent}
                    onChange={(event) => setEmailConsent(event.target.checked)}
                  />
                  <span>
                    I agree to receive event reminders by email.
                    {errors.emailConsent ? (
                      <span className="mt-1 block text-red">{errors.emailConsent}</span>
                    ) : null}
                  </span>
                </label>
              ) : null}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Send me reminders"}
              </Button>
            </div>
          </form>
        ) : null}

        {step === "success" || step === "existing" ? (
          <div>
            <h2 id="rsvp-title" className="font-display text-3xl font-bold">
              {step === "existing" ? "You are already on the list" : "We will see you there"}
            </h2>
            <p className="mt-3 text-muted">
              {dateLabel}. {edition.venue.name}. Reminders will follow on the
              channels you chose.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button type="button" onClick={() => downloadIcs(edition)}>
                Add to calendar
              </Button>
              <Button href="/experience/2026" variant="outlineDark" onClick={() => setOpen(false)}>
                View event details
              </Button>
            </div>
            <button
              type="button"
              className="mt-6 text-sm text-muted underline"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
    </dialog>
  );
}

export function RsvpCta() {
  const edition = getCurrentEdition();
  return (
    <section id="rsvp" className="bg-ink py-20 text-white">
      <div className="container-narrow text-center">
        <h2 className="font-display text-4xl font-bold sm:text-5xl">
          Save your place for {edition.year}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/70">
          Tell us you are coming and choose how you want to be reminded. An RSVP
          is intent. Attendance is recorded at the venue.
        </p>
        <div className="mt-8">
          <OpenRsvpButton variant="inverse">I&apos;ll attend</OpenRsvpButton>
        </div>
      </div>
    </section>
  );
}

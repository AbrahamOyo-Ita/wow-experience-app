"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, PhoneField, TextInput } from "@/components/ui/field";
import { attendanceService } from "@/services";
import { flattenZodErrors, attendanceSchema } from "@/lib/validation";
import { formatEventDate, formatEventTime } from "@/lib/utils";
import type { EventEdition } from "@/types";

type UiState =
  | "ready"
  | "submitting"
  | "success"
  | "duplicate"
  | "outside_window"
  | "offline"
  | "failure";

const MOCK_STATES: UiState[] = [
  "ready",
  "success",
  "duplicate",
  "outside_window",
  "offline",
  "failure",
];

const isDev = process.env.NODE_ENV !== "production";

export function CheckInForm({ edition }: { edition: EventEdition }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mockState = searchParams.get("mockState");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [occupation, setOccupation] = useState("");
  const [attendanceConsent, setAttendanceConsent] = useState(false);
  const [communicationConsent, setCommunicationConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [ui, setUi] = useState<UiState>(() => {
    if (isDev && mockState && MOCK_STATES.includes(mockState as UiState)) {
      return mockState as UiState;
    }
    return "ready";
  });

  const when = useMemo(
    () =>
      `${formatEventDate(edition.startsAt, edition.timezone)}, ${formatEventTime(edition.startsAt, edition.timezone)}`,
    [edition],
  );

  const setMock = (state: UiState) => {
    const params = new URLSearchParams(searchParams.toString());
    if (state === "ready") params.delete("mockState");
    else params.set("mockState", state);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    setUi(state === "submitting" ? "ready" : state);
    setFormError(null);
  };

  useEffect(() => {
    if (!isDev) return;
    const id = window.setTimeout(() => {
      if (mockState && MOCK_STATES.includes(mockState as UiState)) {
        setUi(mockState as UiState);
      } else if (!mockState) {
        setUi((current) => (current === "submitting" ? current : current === "ready" ? "ready" : current));
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [mockState]);

  const submit = async () => {
    setFormError(null);
    const parsed = attendanceSchema.safeParse({
      fullName,
      email,
      phone,
      occupation,
      consentAttendance: attendanceConsent,
      consentReminders: communicationConsent,
    });
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      setUi("ready");
      return;
    }
    setErrors({});
    setUi("submitting");
    const result = await attendanceService.checkIn({
      eventId: edition.id,
      fullName,
      email,
      phone,
      occupation,
      consentAttendance: attendanceConsent,
      consentReminders: communicationConsent,
    });
    const status = result.status as string;
    const message = "message" in result ? String(result.message) : "";
    if (status === "validation" || status === "validation_error") {
      const fieldErrors = "errors" in result && Array.isArray(result.errors) ? result.errors : [];
      setErrors(Object.fromEntries(fieldErrors.map((row) => [row.field, row.message])));
      setUi("ready");
      return;
    }
    if (status === "success") {
      setUi("success");
      return;
    }
    if (status === "duplicate") {
      setUi("duplicate");
      return;
    }
    if (status === "outside_window" || status === "outside_event_window") {
      setFormError(message || "Check-in is not open.");
      setUi("outside_window");
      return;
    }
    if (status === "offline" || status === "offline_pending") {
      setFormError(message || "Saved on this phone.");
      setUi("offline");
      return;
    }
    setFormError(message || "Check-in did not confirm. Please retry.");
    setUi("failure");
  };

  const resetToForm = () => {
    setUi("ready");
    setFormError(null);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      {ui === "success" ? (
        <ResultPanel
          title="You are checked in"
          body={`Welcome, ${fullName || "friend"}. Thank you for being part of ${edition.shortName}. Please follow the ushers inside.`}
          actionLabel="Check in another guest"
          onAction={resetToForm}
        />
      ) : null}

      {ui === "duplicate" ? (
        <ResultPanel
          title="Already recorded"
          body="This name and contact already have an attendance record for today. If this is a mistake, ask a steward at the desk."
          actionLabel="Back to form"
          onAction={resetToForm}
        />
      ) : null}

      {ui === "outside_window" ? (
        <ResultPanel
          title="Check-in is not open"
          body={
            formError ??
            `Attendance is only recorded during the event window. ${edition.shortName} is planned for ${when}.`
          }
          actionLabel="Keep my details"
          onAction={resetToForm}
        />
      ) : null}

      {ui === "offline" ? (
        <ResultPanel
          title="Saved on this phone"
          body={
            formError ??
            "The network dropped before confirmation. Your details stayed on this device. Retry when you have signal, or speak to a steward."
          }
          actionLabel="Retry"
          onAction={() => void submit()}
        />
      ) : null}

      {ui === "failure" ? (
        <ResultPanel
          title="Check-in did not confirm"
          body={formError ?? "The desk could not confirm this record. Your answers are still here. Please retry."}
          actionLabel="Retry"
          onAction={() => void submit()}
        />
      ) : null}

      {ui === "ready" || ui === "submitting" ? (
        <form
          className="grid gap-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div>
            <p className="text-sm font-semibold text-red">{edition.shortName}</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-ink">Event-day check-in</h1>
            <p className="mt-2 text-sm text-muted">
              Scan at the door. This records presence. It is not an RSVP.
            </p>
            <p className="mt-1 text-sm text-muted">{when}</p>
          </div>

          {formError && ui === "ready" ? (
            <p className="bg-red-soft px-3 py-2 text-sm text-red-deep" role="alert">
              {formError}
            </p>
          ) : null}

          <Field id="att-name" label="Full name" error={errors.fullName}>
            <TextInput
              id="att-name"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              error={errors.fullName}
            />
          </Field>
          <Field id="att-email" label="Email" error={errors.email}>
            <TextInput
              id="att-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
            />
          </Field>
          <Field
            id="att-phone"
            label="WhatsApp"
            hint="Nigeria numbers can start with 0 or +234."
            error={errors.phone}
          >
            <PhoneField
              id="att-phone"
              value={phone}
              onChange={setPhone}
              error={errors.phone}
            />
          </Field>
          <Field id="att-occupation" label="Occupation" error={errors.occupation}>
            <TextInput
              id="att-occupation"
              autoComplete="organization-title"
              value={occupation}
              onChange={(event) => setOccupation(event.target.value)}
              error={errors.occupation}
            />
          </Field>
          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={attendanceConsent}
              onChange={(event) => setAttendanceConsent(event.target.checked)}
            />
            <span>
              I agree that Wonders of Worship Experience may record my attendance for this gathering.
              {errors.consentAttendance ? (
                <span className="mt-1 block text-red">{errors.consentAttendance}</span>
              ) : null}
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={communicationConsent}
              onChange={(event) => setCommunicationConsent(event.target.checked)}
            />
            <span>
              I agree to receive gathering updates on WhatsApp or email. This is optional.
            </span>
          </label>
          <Button
            type="submit"
            disabled={ui === "submitting"}
            className="h-12 w-full bg-red text-white hover:bg-red-deep"
            size="lg"
          >
            {ui === "submitting" ? "Recording…" : "Check in"}
          </Button>
        </form>
      ) : null}

      {isDev ? (
        <div className="mt-10 border border-dashed border-border p-3">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Mock states
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MOCK_STATES.map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => setMock(state)}
                className={`px-2 py-1 text-xs ${
                  ui === state || mockState === state
                    ? "bg-ink text-white"
                    : "border border-border bg-white text-ink"
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ResultPanel({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
      <p className="mt-3 text-muted">{body}</p>
      <Button
        type="button"
        className="mt-8 h-12 w-full bg-ink text-white hover:bg-ink/90"
        size="lg"
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  );
}

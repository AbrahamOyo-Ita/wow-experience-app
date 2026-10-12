"use client";

import { useState } from "react";
import { CheckCircle2, LockKeyhole, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { prayerRequestSchema, flattenZodErrors } from "@/lib/validation";
import { prayerRequestService } from "@/services";

const emptyForm = {
  name: "",
  prayerPoint: "",
  desiredOutcome: "",
  isAnonymous: false,
  isUrgent: false,
};

export function PrayerForm() {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="flex min-h-[410px] flex-col justify-center" role="status" aria-live="polite">
        <CheckCircle2 className="h-11 w-11 text-red" strokeWidth={1.7} aria-hidden="true" />
        <h2 className="mt-6 font-display text-4xl font-bold text-ink sm:text-5xl">
          Your prayer has been received.
        </h2>
        <p className="mt-4 max-w-md text-base leading-7 text-muted">
          Thank you for trusting us with it. Our prayer team will stand with you in faith.
        </p>
        <div className="mt-8">
          <Button
            variant="outlineDark"
            onClick={() => {
              setValues(emptyForm);
              setSubmitted(false);
            }}
          >
            Share another prayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="grid gap-5"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        setFormError(null);

        const payload = {
          ...values,
          name: values.isAnonymous ? "" : values.name,
          source: "prayer-page-qr",
        };
        const parsed = prayerRequestSchema.safeParse(payload);
        if (!parsed.success) {
          setErrors(flattenZodErrors(parsed.error));
          return;
        }

        setErrors({});
        setSubmitting(true);
        const result = await prayerRequestService.submit(parsed.data);
        setSubmitting(false);

        if (result.status === "validation" || result.status === "validation_error") {
          setErrors(
            Object.fromEntries(result.errors.map((row) => [row.field, row.message])),
          );
          return;
        }
        if (result.status === "offline" || result.status === "error") {
          setFormError(result.message);
          return;
        }
        setSubmitted(true);
      }}
    >
      {formError ? (
        <p className="rounded-xl border border-red/20 bg-red-soft px-4 py-3 text-sm text-red-deep" role="alert">
          {formError}
        </p>
      ) : null}

      <Field
        id="prayer-name"
        label="Your name (optional)"
        hint="Leave this blank or choose anonymous below."
        error={errors.name}
      >
        <TextInput
          id="prayer-name"
          autoComplete="name"
          value={values.name}
          disabled={values.isAnonymous}
          onChange={(event) =>
            setValues((current) => ({ ...current, name: event.target.value }))
          }
          error={errors.name}
        />
      </Field>

      <Field
        id="prayer-point"
        label="What is your prayer point?"
        hint={`${values.prayerPoint.length}/2,000 characters`}
        error={errors.prayerPoint}
      >
        <TextArea
          id="prayer-point"
          value={values.prayerPoint}
          maxLength={2000}
          className="min-h-40 resize-y"
          onChange={(event) =>
            setValues((current) => ({ ...current, prayerPoint: event.target.value }))
          }
          error={errors.prayerPoint}
        />
      </Field>

      <Field
        id="desired-outcome"
        label="What would you like God to do at the event?"
        hint={`${values.desiredOutcome.length}/1,000 characters`}
        error={errors.desiredOutcome}
      >
        <TextArea
          id="desired-outcome"
          value={values.desiredOutcome}
          maxLength={1000}
          className="min-h-28 resize-y"
          onChange={(event) =>
            setValues((current) => ({ ...current, desiredOutcome: event.target.value }))
          }
          error={errors.desiredOutcome}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-paper/60 p-4 text-sm text-ink transition hover:border-ink/30">
          <input
            type="checkbox"
            checked={values.isAnonymous}
            onChange={(event) =>
              setValues((current) => ({ ...current, isAnonymous: event.target.checked }))
            }
            className="mt-0.5 h-4 w-4 accent-red"
          />
          <span>
            <span className="block font-semibold">Keep me anonymous</span>
            <span className="mt-1 block leading-5 text-muted">Your name will not be saved.</span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-paper/60 p-4 text-sm text-ink transition hover:border-ink/30">
          <input
            type="checkbox"
            checked={values.isUrgent}
            onChange={(event) =>
              setValues((current) => ({ ...current, isUrgent: event.target.checked }))
            }
            className="mt-0.5 h-4 w-4 accent-red"
          />
          <span>
            <span className="block font-semibold">This feels urgent</span>
            <span className="mt-1 block leading-5 text-muted">Help the prayer team notice it sooner.</span>
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex max-w-sm items-start gap-2 text-xs leading-5 text-muted">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-red" strokeWidth={1.8} aria-hidden="true" />
          Prayer requests are private and only available to authorized team members.
        </p>
        <Button type="submit" size="lg" disabled={submitting} className="gap-2 sm:min-w-40">
          <Send className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          {submitting ? "Sending..." : "Send prayer"}
        </Button>
      </div>
    </form>
  );
}

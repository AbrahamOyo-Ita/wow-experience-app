"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, PhoneField, SelectInput, TextInput } from "@/components/ui/field";
import { flattenZodErrors, unsubscribeSchema } from "@/lib/validation";
import { contactService } from "@/services";
import type { Channel } from "@/types";

export function UnsubscribeForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<Channel>("both");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="max-w-xl border-t border-border pt-8">
        <h2 className="font-display text-3xl font-bold">You have been removed</h2>
        <p className="mt-3 text-muted">
          We will stop sending event reminders on the channel you chose. If you
          used both WhatsApp and email, this request covers both. You can RSVP
          again later if you change your mind.
        </p>
      </div>
    );
  }

  return (
    <form
      className="grid max-w-xl gap-5"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        setFormError(null);
        const parsed = unsubscribeSchema.safeParse({ email, phone, channel });
        if (!parsed.success) {
          setErrors(flattenZodErrors(parsed.error));
          return;
        }
        setErrors({});
        setSubmitting(true);
        const result = await contactService.unsubscribe({
          email: email || undefined,
          phone: phone || undefined,
          channel,
        });
        setSubmitting(false);
        if (result.status === "validation") {
          setErrors(
            Object.fromEntries(
              result.errors.map((row: { field: string; message: string }) => [row.field, row.message]),
            ),
          );
          return;
        }
        if (result.status === "offline" || result.status === "error") {
          setFormError(result.message);
          return;
        }
        setDone(true);
      }}
    >
      {formError ? (
        <p className="rounded-md bg-red-soft px-3 py-2 text-sm text-red-deep" role="alert">
          {formError}
        </p>
      ) : null}

      <Field
        id="unsub-email"
        label="Email address"
        optional
        error={errors.email}
      >
        <TextInput
          id="unsub-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
      </Field>

      <Field
        id="unsub-phone"
        label="WhatsApp number"
        optional
        hint="Enter the number we used for reminders, if any."
        error={errors.phone}
      >
        <PhoneField
          id="unsub-phone"
          value={phone}
          onChange={setPhone}
          error={errors.phone}
        />
      </Field>

      <Field id="unsub-channel" label="Stop messages on">
        <SelectInput
          id="unsub-channel"
          value={channel}
          onValueChange={(value) => setChannel(value as Channel)}
          options={[
            { value: "whatsapp", label: "WhatsApp only" },
            { value: "email", label: "Email only" },
            { value: "both", label: "WhatsApp and email" },
          ]}
        />
      </Field>

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Updating…" : "Stop reminders"}
        </Button>
      </div>
    </form>
  );
}

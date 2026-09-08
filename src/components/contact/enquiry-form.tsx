"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, PhoneField, TextArea, TextInput } from "@/components/ui/field";
import { enquirySchema, flattenZodErrors } from "@/lib/validation";
import { contactService } from "@/services";

const empty = {
  name: "",
  email: "",
  phone: "",
  message: "",
};

export function EnquiryForm() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="border-t border-border pt-8">
        <h3 className="font-display text-3xl font-bold">Message received</h3>
        <p className="mt-3 text-muted">
          Thank you. We will reply to the email you gave. For event reminders,
          please RSVP so we only write on a channel you have approved.
        </p>
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
        const parsed = enquirySchema.safeParse(values);
        if (!parsed.success) {
          setErrors(flattenZodErrors(parsed.error));
          return;
        }
        setErrors({});
        setSubmitting(true);
        const result = await contactService.enquiry({
          name: values.name,
          email: values.email,
          phone: values.phone,
          message: values.message,
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

      <Field id="enq-name" label="Name" error={errors.name}>
        <TextInput
          id="enq-name"
          autoComplete="name"
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          error={errors.name}
        />
      </Field>

      <Field id="enq-email" label="Email address" error={errors.email}>
        <TextInput
          id="enq-email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
          error={errors.email}
        />
      </Field>

      <Field
        id="enq-phone"
        label="WhatsApp number"
        hint="Nigeria numbers can start with 0 or +234."
        error={errors.phone}
      >
        <PhoneField
          id="enq-phone"
          value={values.phone}
          onChange={(phone) => setValues((current) => ({ ...current, phone }))}
          error={errors.phone}
        />
      </Field>

      <Field id="enq-message" label="How can we help?" error={errors.message}>
        <TextArea
          id="enq-message"
          value={values.message}
          onChange={(event) =>
            setValues((current) => ({ ...current, message: event.target.value }))
          }
          error={errors.message}
        />
      </Field>

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}

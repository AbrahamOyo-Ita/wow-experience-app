"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VolunteerStatusBadge } from "@/components/ui/status-badge";
import {
  Field,
  PhoneField,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/ui/field";
import { flattenZodErrors, volunteerSchema } from "@/lib/validation";
import { volunteerService } from "@/services";
import type { VolunteerTeam } from "@/types";

const empty = {
  fullName: "",
  email: "",
  phone: "",
  occupation: "",
  location: "",
  teamId: "",
  experience: "",
  availability: "",
  motivation: "",
  whatsappConsent: false,
  emailConsent: false,
};

export function VolunteerForm({
  editionId,
  teams,
}: {
  editionId: string;
  teams: VolunteerTeam[];
}) {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fieldShell = "rounded-md border border-border bg-white p-5 shadow-sm shadow-ink/5";
  const teamOptions = [
    { value: "", label: "Choose a team" },
    ...teams.map((team) => ({
      value: team.id,
      label: `${team.name}${team.status === "closed" ? " (closed)" : ""}`,
      disabled: team.status === "closed",
    })),
  ];

  const set =
    (key: keyof typeof empty) =>
    (value: string | boolean) => {
      setValues((current) => ({ ...current, [key]: value }));
    };

  if (teams.length === 0) {
    return (
      <p className="max-w-xl text-muted">
        Volunteer teams for this edition are not open yet. RSVP as a guest and
        check this page again when applications open.
      </p>
    );
  }

  if (done) {
    return (
      <div className="max-w-xl border-t border-border pt-8">
        <VolunteerStatusBadge status="submitted" />
        <h3 className="mt-4 font-display text-3xl font-bold">
          We have your application
        </h3>
        <p className="mt-3 text-muted">
          A team lead will read this and reply on WhatsApp and email. If we
          cannot place you, please still come and worship with us.
        </p>
      </div>
    );
  }

  return (
    <form
      className="grid max-w-3xl gap-4"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        setFormError(null);
        const parsed = volunteerSchema.safeParse({
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          occupation: values.occupation,
          location: values.location,
          teamId: values.teamId,
          experience: values.experience,
          availability: values.availability,
          motivation: values.motivation,
          consentWhatsApp: values.whatsappConsent,
          consentEmail: values.emailConsent,
        });
        if (!parsed.success) {
          setErrors(flattenZodErrors(parsed.error));
          return;
        }
        setErrors({});
        setSubmitting(true);
        const result = await volunteerService.submit({
          eventId: editionId,
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          occupation: values.occupation,
          location: values.location,
          teamId: values.teamId,
          experience: values.experience,
          availability: values.availability,
          motivation: values.motivation,
          consentWhatsApp: values.whatsappConsent,
          consentEmail: values.emailConsent,
        });
        setSubmitting(false);
        if (result.status === "validation" || result.status === "validation_error") {
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
        <p className="rounded-md border border-red/20 bg-red-soft px-4 py-3 text-sm text-red-deep" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="rounded-md border border-border bg-white p-6 shadow-sm shadow-ink/5">
        <div className="h-2 w-full rounded-t-md bg-red" />
        <h3 className="mt-5 font-display text-4xl leading-none text-ink">
          Volunteer application
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
          Answer plainly. Team leads review every application before adding
          anyone to a working group.
        </p>
      </div>

      <Field id="vol-name" label="Full name" error={errors.fullName} className={fieldShell}>
        <TextInput
          id="vol-name"
          autoComplete="name"
          value={values.fullName}
          onChange={(event) => set("fullName")(event.target.value)}
          error={errors.fullName}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="vol-email" label="Email address" error={errors.email} className={fieldShell}>
          <TextInput
            id="vol-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => set("email")(event.target.value)}
            error={errors.email}
          />
        </Field>
        <Field
          id="vol-phone"
          label="WhatsApp number"
          hint="Nigeria numbers can start with 0 or +234."
          error={errors.phone}
          className={fieldShell}
        >
          <PhoneField
            id="vol-phone"
            value={values.phone}
            onChange={(value) => set("phone")(value)}
            error={errors.phone}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="vol-occupation" label="Occupation" error={errors.occupation} className={fieldShell}>
          <TextInput
            id="vol-occupation"
            value={values.occupation}
            onChange={(event) => set("occupation")(event.target.value)}
            error={errors.occupation}
          />
        </Field>
        <Field id="vol-location" label="Location" error={errors.location} className={fieldShell}>
          <TextInput
            id="vol-location"
            value={values.location}
            onChange={(event) => set("location")(event.target.value)}
            error={errors.location}
          />
        </Field>
      </div>

      <Field id="vol-team" label="Preferred team" error={errors.teamId} className={fieldShell}>
        <SelectInput
          id="vol-team"
          value={values.teamId}
          onValueChange={(value) => set("teamId")(value)}
          error={errors.teamId}
          options={teamOptions}
        />
      </Field>

      <Field
        id="vol-experience"
        label="Relevant experience"
        hint="A few sentences is enough. Church teams, hospitality, media or music all count."
        error={errors.experience}
        className={fieldShell}
      >
        <TextArea
          id="vol-experience"
          value={values.experience}
          onChange={(event) => set("experience")(event.target.value)}
          error={errors.experience}
        />
      </Field>

      <Field
        id="vol-availability"
        label="Availability"
        hint="Include rehearsal if you are applying for worship, and how early you can arrive."
        error={errors.availability}
        className={fieldShell}
      >
        <TextArea
          id="vol-availability"
          value={values.availability}
          onChange={(event) => set("availability")(event.target.value)}
          error={errors.availability}
        />
      </Field>

      <Field
        id="vol-motivation"
        label="Why do you want to serve?"
        error={errors.motivation}
        className={fieldShell}
      >
        <TextArea
          id="vol-motivation"
          value={values.motivation}
          onChange={(event) => set("motivation")(event.target.value)}
          error={errors.motivation}
        />
      </Field>

      {errors.consent ? (
        <p className="text-sm text-red" role="alert">
          {errors.consent}
        </p>
      ) : null}

      <label className="flex items-start gap-3 rounded-md border border-border bg-white p-5 text-sm shadow-sm shadow-ink/5">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-red"
          checked={values.whatsappConsent}
          onChange={(event) => set("whatsappConsent")(event.target.checked)}
        />
        <span>
          I agree to receive application updates on WhatsApp.
          {errors.consentWhatsApp || errors.whatsappConsent ? (
            <span className="mt-1 block text-red">
              {errors.consentWhatsApp || errors.whatsappConsent}
            </span>
          ) : null}
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-md border border-border bg-white p-5 text-sm shadow-sm shadow-ink/5">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-red"
          checked={values.emailConsent}
          onChange={(event) => set("emailConsent")(event.target.checked)}
        />
        <span>
          I agree to receive application updates by email.
          {errors.consentEmail || errors.emailConsent ? (
            <span className="mt-1 block text-red">
              {errors.consentEmail || errors.emailConsent}
            </span>
          ) : null}
        </span>
      </label>

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Submit application"}
        </Button>
      </div>
    </form>
  );
}

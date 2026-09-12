"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { updateAccountPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Wordmark } from "@/components/site/wordmark";

const ERRORS: Record<string, string> = {
  short: "Password must be at least 6 characters long.",
  mismatch: "Passwords do not match. Please try again.",
  invalid: "Your session has expired. Please request a new sign-in link.",
};

function SetPasswordContent() {
  const searchParams = useSearchParams();
  const rawError = searchParams.get("error");
  const errorMessage = rawError ? (ERRORS[rawError] ?? decodeURIComponent(rawError)) : null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold tracking-[0.14em] text-red uppercase">Admin Account</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Set New Password</h1>
      <p className="mt-3 text-muted">
        Enter a new password for your administrator account. Once set, you can sign in directly with your email and password.
      </p>

      {errorMessage ? (
        <p className="mt-6 rounded-md bg-red-soft px-3 py-2 text-sm text-red-deep" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <form className="mt-8 grid gap-5" action={updateAccountPassword}>
        <Field id="new-password" label="New Password">
          <TextInput
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </Field>
        <Field id="confirm-password" label="Confirm New Password">
          <TextInput
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </Field>
        <Button type="submit">Update Password</Button>
      </form>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-border px-6 py-5">
        <Wordmark />
      </header>
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted">Loading...</div>}>
        <SetPasswordContent />
      </Suspense>
    </div>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { sendAdminMagicLink, signInWithPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Wordmark } from "@/components/site/wordmark";

const ERRORS: Record<string, string> = {
  missing: "Enter the email and password from your invite.",
  invalid: "That email or password is not recognised.",
  forbidden: "This account is not an invited administrator.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const error = searchParams.get("error");
  const magic = searchParams.get("magic");

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-border px-6 py-5">
        <Wordmark />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <p className="text-sm font-semibold tracking-[0.14em] text-red uppercase">Admin</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-3 text-muted">
          Access is invite-only. Use the email you were invited with. Guests RSVP on the public site.
        </p>
        {error ? (
          <p className="mt-6 rounded-md bg-red-soft px-3 py-2 text-sm text-red-deep" role="alert">
            {ERRORS[error] ?? "Sign in failed. Try again."}
          </p>
        ) : null}
        {magic === "sent" ? (
          <p className="mt-6 rounded-md border border-border bg-paper px-3 py-2 text-sm text-ink" role="status">
            If that email is an invited administrator, a secure sign-in link has been sent.
          </p>
        ) : null}
        <form className="mt-8 grid gap-5" action={signInWithPassword}>
          <input type="hidden" name="next" value={next} />
          <Field id="admin-email" label="Email">
            <TextInput
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </Field>
          <Field id="admin-password" label="Password">
            <TextInput
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
          <Button type="submit">Sign in</Button>
        </form>
        <div className="my-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          <span className="h-px flex-1 bg-border" />
          <span>Or</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <form className="grid gap-5" action={sendAdminMagicLink}>
          <input type="hidden" name="next" value={next} />
          <Field id="admin-magic-email" label="Email for magic link">
            <TextInput
              id="admin-magic-email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </Field>
          <Button type="submit" variant="outlineDark">Send secure magic link</Button>
        </form>
      </main>
    </div>
  );
}

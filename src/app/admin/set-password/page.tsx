"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { updateAccountPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Wordmark } from "@/components/site/wordmark";
import { ShieldCheck, Lock, Eye, EyeOff } from "lucide-react";

const ERRORS: Record<string, string> = {
  short: "Password must be at least 8 characters long.",
  mismatch: "Passwords do not match. Please try again.",
  invalid: "Your session has expired. Please request a new sign-in link from your administrator.",
};

function SetPasswordContent() {
  const searchParams = useSearchParams();
  const rawError = searchParams.get("error");
  const errorMessage = rawError ? (ERRORS[rawError] ?? decodeURIComponent(rawError)) : null;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      {/* Icon Badge */}
      <div className="flex justify-center mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-900/25">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
      </div>

      {/* Heading */}
      <div className="text-center">
        <p className="text-xs font-bold tracking-[0.18em] text-red uppercase mb-2">
          WOW Experience • Secure Account Setup
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          Set Your Password
        </h1>
        <p className="mt-3 text-sm text-muted max-w-sm mx-auto leading-relaxed">
          Your administrative credentials have been issued. Create a strong password to activate your access to the WOW Experience Operations Console.
        </p>
      </div>

      {errorMessage ? (
        <div className="mt-6 rounded-xl border border-red/20 bg-rose-50 px-4 py-3 text-sm text-red font-medium text-center" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {/* Divider */}
      <div className="my-8 flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <Lock className="h-3.5 w-3.5 text-muted" />
        <div className="flex-1 h-px bg-border" />
      </div>

      <form className="grid gap-5" action={updateAccountPassword}>
        <Field id="new-password" label="New Password">
          <div className="relative">
            <TextInput
              id="new-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              placeholder="Choose a strong password (8+ characters)"
              required
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Field id="confirm-password" label="Confirm New Password">
          <div className="relative">
            <TextInput
              id="confirm-password"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              placeholder="Re-enter password"
              required
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <Button type="submit" className="w-full mt-2 shadow-sm shadow-red/20">
          Activate Account & Enter Console
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-muted leading-relaxed">
        By activating your account, you agree to handle all WOW Experience data with confidentiality and integrity.
      </p>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-border px-6 py-5 flex items-center justify-between">
        <Wordmark />
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Secure Setup Mode
        </span>
      </header>
      <Suspense fallback={<div className="p-8 text-center text-sm text-muted">Loading...</div>}>
        <SetPasswordContent />
      </Suspense>
    </div>
  );
}

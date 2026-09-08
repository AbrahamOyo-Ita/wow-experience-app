"use client";

import { Check, ChevronDown } from "lucide-react";
import type * as React from "react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Field({
  id,
  label,
  hint,
  error,
  optional = false,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional ? (
          <span className="ml-2 font-normal text-muted">Optional</span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  id,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      id={id}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : props["aria-describedby"]}
      className={cn(
        "h-12 w-full rounded-md border bg-white px-4 text-base text-ink placeholder:text-muted/70",
        error ? "border-red" : "border-border",
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({
  id,
  error,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <textarea
      id={id}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(
        "min-h-32 w-full rounded-md border bg-white px-4 py-3 text-base text-ink placeholder:text-muted/70",
        error ? "border-red" : "border-border",
        className,
      )}
      {...props}
    />
  );
}

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export function SelectInput({
  id,
  value,
  onValueChange,
  options,
  error,
  placeholder = "Select an option",
  className,
  buttonClassName,
  disabled = false,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-describedby={error ? `${id}-error` : ariaDescribedBy}
        aria-label={ariaLabel}
        data-invalid={Boolean(error) || undefined}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-md border bg-white px-4 text-left text-base text-ink transition hover:border-ink/35 disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-red" : "border-border",
          buttonClassName,
        )}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className={selected ? "truncate" : "truncate text-muted"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-64 overflow-y-auto rounded-md border border-border bg-white p-1 shadow-lg shadow-ink/10"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                disabled={option.disabled}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2.5 text-left text-sm text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:text-muted/60",
                  active && "bg-red-soft font-semibold text-red-deep",
                )}
                onClick={() => {
                  if (option.disabled) return;
                  onValueChange(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                {active ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function PhoneField({
  id,
  value,
  onChange,
  error,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-12 overflow-hidden rounded-md border bg-white",
        error ? "border-red" : "border-border",
      )}
    >
      <span className="flex items-center border-r border-border bg-paper px-3 text-sm font-semibold text-ink">
        +234
      </span>
      <input
        id={id}
        inputMode="tel"
        autoComplete="tel"
        placeholder="803 123 4567"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
        className="min-w-0 flex-1 bg-transparent px-3 text-base text-ink outline-none placeholder:text-muted/70"
      />
    </div>
  );
}

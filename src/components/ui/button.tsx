import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold tracking-tight transition duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-red whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-red text-white hover:bg-red-deep",
        primary: "bg-red text-white hover:bg-red-deep",
        inverse: "bg-white text-ink hover:bg-white/90",
        outlineLight: "border border-white bg-transparent text-white hover:bg-white/10",
        outlineDark: "border border-ink bg-transparent text-ink hover:bg-ink/5",
        outline: "border border-ink bg-transparent text-ink hover:bg-ink/5",
        ghost: "bg-transparent text-ink hover:bg-paper",
        secondary: "bg-ink text-white hover:bg-ink/90",
        destructive: "bg-red-deep text-white hover:bg-ink",
        link: "rounded-none px-0 py-0 text-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11",
        sm: "min-h-9 px-4 py-2 text-xs",
        lg: "min-h-12 px-7",
        icon: "h-11 w-11 px-0 py-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    href?: string;
  };

function Button({ className, variant, size, href, type = "button", ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, className }));
  if (href) {
    const external =
      href.startsWith("http") ||
      href.startsWith("mailto:") ||
      href.startsWith("data:") ||
      href.startsWith("blob:");
    if (external) {
      return (
        <a
          href={href}
          className={classes}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noreferrer" : undefined}
        >
          {props.children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {props.children}
      </Link>
    );
  }
  return <button type={type} className={classes} {...props} />;
}

export { Button, buttonVariants };

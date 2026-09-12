import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "https://wow-experience-app.vercel.app"),
  title: {
    default: "Wonders of Worship Experience 2026",
    template: "%s | Wonders of Worship Experience",
  },
  description:
    "Wonders of Worship Experience 2026 is a focused Christian gathering for worship, the word and response.",
  openGraph: {
    title: "Wonders of Worship Experience 2026",
    description:
      "A gathered people, a clear gospel, and room to respond. RSVP for reminders.",
    images: ["/images/hero-worship.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-white font-sans text-ink">{children}</body>
    </html>
  );
}

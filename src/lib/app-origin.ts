const PRODUCTION_FALLBACK = "https://www.wowexperience.com.ng";

function normalizeOrigin(value: string | undefined) {
  if (!value) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    return url.origin;
  } catch {
    return null;
  }
}

export function getAppOrigin() {
  const configured =
    normalizeOrigin(process.env.APP_URL) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeOrigin(process.env.VERCEL_URL);

  if (
    configured &&
    (process.env.NODE_ENV !== "production" ||
      (!configured.includes("localhost") && !configured.includes("vercel.app")))
  ) {
    return configured;
  }

  return process.env.NODE_ENV === "production" ? PRODUCTION_FALLBACK : configured ?? "http://localhost:3000";
}


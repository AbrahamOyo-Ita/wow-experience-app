const NG_PREFIX = "234";

export function normalizeNgPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  let normalized = digits;
  if (normalized.startsWith("0") && normalized.length === 11) {
    normalized = NG_PREFIX + normalized.slice(1);
  } else if (normalized.startsWith(NG_PREFIX)) {
    normalized = digits;
  } else if (normalized.length === 10) {
    normalized = NG_PREFIX + normalized;
  }

  if (!normalized.startsWith(NG_PREFIX) || normalized.length !== 13) {
    return null;
  }
  return `+${normalized}`;
}

export function displayNgPhone(e164: string) {
  const digits = e164.replace(/\D/g, "");
  if (!digits.startsWith(NG_PREFIX) || digits.length !== 13) return e164;
  return `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isLikelyValidPhone(input: string) {
  return Boolean(normalizeNgPhone(input));
}

export const normalizeNigerianPhone = normalizeNgPhone;

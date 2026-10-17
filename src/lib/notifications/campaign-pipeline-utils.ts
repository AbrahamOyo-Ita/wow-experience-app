export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function renderCampaignTemplate(template: string, payload: Record<string, unknown>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(payload[key] ?? ""));
}

export function parseLagosDateTime(value: string) {
  if (!value) return null;
  if (/[zZ]|[+-]\d\d:\d\d$/.test(value)) return new Date(value);
  return new Date(`${value}:00+01:00`);
}

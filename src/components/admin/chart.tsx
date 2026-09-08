import { cn } from "@/lib/utils";

export function BarList({
  items,
  tone = "red",
}: {
  items: { label: string; value: number }[];
  tone?: "red" | "ink";
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  if (!items.length) {
    return <p className="text-sm text-muted">No values to chart for this edition.</p>;
  }
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-ink">{item.label}</span>
            <span className="tabular-nums text-muted">{item.value}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full bg-paper">
            <div
              className={cn("h-full", tone === "red" ? "bg-red" : "bg-ink")}
              style={{
                width: `${Math.max((item.value / max) * 100, item.value ? 4 : 0)}%`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function HourlyBars({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  if (!items.length) {
    return <p className="text-sm text-muted">No hourly data yet.</p>;
  }
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="flex h-36 items-end gap-2 overflow-x-auto pb-2" role="img" aria-label="Hourly attendance bars">
      {items.map((item) => (
        <div key={item.label} className="flex min-w-[2.5rem] flex-1 flex-col items-center gap-2">
          <div className="flex h-28 w-full items-end bg-paper">
            <div
              className="w-full bg-ink"
              style={{ height: `${(item.value / max) * 100}%` }}
              title={`${item.label}: ${item.value}`}
            />
          </div>
          <span className="text-[10px] tabular-nums text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function FunnelChart({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  if (!items.length) {
    return <p className="text-sm text-muted">No funnel data yet.</p>;
  }
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <ul className="grid gap-2">
      {items.map((item, index) => {
        const width = Math.max((item.value / max) * 100, item.value ? 12 : 4);
        return (
          <li key={item.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-ink">{item.label}</span>
              <span className="tabular-nums text-muted">{item.value}</span>
            </div>
            <div
              className="mt-1 h-8 bg-red/90"
              style={{ width: `${width}%`, opacity: 1 - index * 0.12 }}
            />
          </li>
        );
      })}
    </ul>
  );
}

export function TrendSparkline({
  values,
  labels,
}: {
  values: number[];
  labels?: string[];
}) {
  if (!values.length) {
    return <p className="text-sm text-muted">No trend data yet.</p>;
  }
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - (value / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <div>
      <svg viewBox="0 0 100 100" className="h-24 w-full text-ink" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          points={points}
        />
      </svg>
      {labels ? (
        <div className="mt-2 flex justify-between text-[10px] text-muted">
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

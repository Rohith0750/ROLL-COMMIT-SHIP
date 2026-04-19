import { Gauge, TrendingUp, TrendingDown } from "lucide-react";

type Risk = "low" | "medium" | "high";

export function RiskGauge({ level }: { level: Risk }) {
  const pct = level === "low" ? 25 : level === "medium" ? 60 : 92;
  const color =
    level === "low"
      ? "var(--toxic)"
      : level === "medium"
        ? "var(--amber-glow)"
        : "oklch(0.65 0.25 25)";
  const label = level.toUpperCase();
  const Trend = level === "high" ? TrendingUp : TrendingDown;

  return (
    <div className="holo-panel p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <Gauge className="w-4 h-4 amber-text" />
          Risk Index
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color }}>
          <Trend className="w-4 h-4" />
          {label}
        </div>
      </div>

      <div className="relative h-4 rounded-full bg-[var(--muted)] overflow-hidden border border-[var(--brass)]/30">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, var(--toxic), var(--amber-glow), oklch(0.65 0.25 25))`,
            boxShadow: `0 0 18px ${color}`,
          }}
        />
        {/* Tick marks */}
        <div className="absolute inset-0 flex justify-between px-1 items-center pointer-events-none">
          {Array.from({ length: 11 }).map((_, i) => (
            <span key={i} className="w-px h-2 bg-background/60" />
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>Stable</span>
        <span>Caution</span>
        <span className="text-destructive">Critical</span>
      </div>
    </div>
  );
}

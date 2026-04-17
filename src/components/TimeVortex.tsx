import { Clock } from "lucide-react";

export function TimeVortex() {
  return (
    <div className="relative w-20 h-20 shrink-0">
      <div className="absolute inset-0 rounded-full vortex opacity-70" />
      <div
        className="absolute inset-1 rounded-full"
        style={{ background: "var(--gradient-vortex)", animation: "spin-rev 5s linear infinite", filter: "blur(2px)", opacity: 0.5 }}
      />
      <div className="absolute inset-3 rounded-full bg-background flex items-center justify-center border border-[var(--brass)]/60 shadow-[inset_0_0_12px_rgba(0,0,0,0.8)]">
        <Clock className="w-7 h-7 neon-text" strokeWidth={1.5} />
      </div>
      <div className="absolute -inset-1 rounded-full border border-[var(--neon)]/30 animate-ping" />
    </div>
  );
}

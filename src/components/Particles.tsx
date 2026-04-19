import { useMemo } from "react";

export function Particles({ count = 30 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const duration = 8 + Math.random() * 14;
        const delay = -Math.random() * duration;
        const size = 1 + Math.random() * 3;
        const colors = ["var(--neon)", "var(--toxic)", "var(--amber-glow)"];
        const color = colors[i % colors.length];
        return { left, duration, delay, size, color, id: i };
      }),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {items.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            bottom: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            boxShadow: `0 0 8px ${p.color}`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

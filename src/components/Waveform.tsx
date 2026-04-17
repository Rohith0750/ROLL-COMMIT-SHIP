export function Waveform({ active = false, bars = 28 }: { active?: boolean; bars?: number }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-12">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={active ? "wave-bar" : ""}
          style={{
            display: "inline-block",
            width: 3,
            height: active ? `${20 + (i % 5) * 8}px` : "4px",
            background: i % 3 === 0 ? "var(--toxic)" : "var(--neon)",
            boxShadow: `0 0 6px ${i % 3 === 0 ? "var(--toxic)" : "var(--neon)"}`,
            animationDelay: `${(i * 60) % 800}ms`,
            borderRadius: 2,
            transition: "height 200ms",
          }}
        />
      ))}
    </div>
  );
}

import { History, Timer, Rocket } from "lucide-react";

export function TimelineSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const phase = value < 33 ? "past" : value < 66 ? "present" : "future";

  return (
    <div className="holo-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Temporal Window
        </div>
        <div className="text-xs amber-text uppercase tracking-widest">{phase}</div>
      </div>

      <div className="relative">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-runnable-track]:h-2
            [&::-webkit-slider-runnable-track]:rounded-full
            [&::-webkit-slider-runnable-track]:bg-gradient-to-r
            [&::-webkit-slider-runnable-track]:from-[var(--brass)]/40
            [&::-webkit-slider-runnable-track]:via-[var(--neon)]
            [&::-webkit-slider-runnable-track]:to-[var(--toxic)]
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-[var(--background)]
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-[var(--neon)]
            [&::-webkit-slider-thumb]:-mt-1.5
            [&::-webkit-slider-thumb]:shadow-[0_0_12px_var(--neon)]"
        />
      </div>

      <div className="flex justify-between mt-4 text-xs">
        <button
          onClick={() => onChange(10)}
          className={`flex flex-col items-center gap-1 transition-all ${phase === "past" ? "neon-text" : "text-muted-foreground"}`}
        >
          <History className="w-5 h-5" />
          Past
        </button>
        <button
          onClick={() => onChange(50)}
          className={`flex flex-col items-center gap-1 transition-all ${phase === "present" ? "amber-text" : "text-muted-foreground"}`}
        >
          <Timer className="w-5 h-5" />
          Present
        </button>
        <button
          onClick={() => onChange(90)}
          className={`flex flex-col items-center gap-1 transition-all ${phase === "future" ? "toxic-text" : "text-muted-foreground"}`}
        >
          <Rocket className="w-5 h-5" />
          Future
        </button>
      </div>
    </div>
  );
}

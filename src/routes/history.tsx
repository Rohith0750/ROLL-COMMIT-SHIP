import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Database, Trash2, Clock } from "lucide-react";
import { type AnalysisResult } from "@/server/drug-analysis";
import Antigravity from "@/components/Antigravity";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const navigate = useNavigate();
  // prettier-ignore
  const [history, setHistory] = useState<{ id: string; timestamp: string; data: AnalysisResult }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("chronoMedHistory");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to parse local history data", error);
      }
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("chronoMedHistory");
    setHistory([]);
  };

  const viewResult = (data: AnalysisResult) => {
    navigate({
      to: "/analysis",
      search: { result: JSON.stringify(data) },
    });
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden font-mono-tw text-foreground">
      {/* 3D DISTORTED BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <Antigravity
          count={200}
          magnetRadius={4}
          ringRadius={20}
          waveSpeed={0.2}
          waveAmplitude={0.5}
          particleSize={0.8}
          lerpSpeed={0.02}
          color="#00FFAA"
          autoAnimate
          fieldStrength={5}
        />
      </div>

      {/* NOISE OVERLAY */}
      <div className="absolute inset-0 z-1 pointer-events-none opacity-20 contrast-150 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
          <button
            onClick={() => navigate({ to: "/" })}
            className="group flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Scanner
          </button>

          <button
            onClick={clearHistory}
            disabled={history.length === 0}
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-destructive hover:text-destructive/80 transition disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Purge Archives
          </button>
        </div>

        <header className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-[10px] uppercase tracking-[0.3em] text-primary mb-4">
            <Database className="w-3 h-3" />
            Temporal Archives
          </div>
          <h1 className="text-4xl font-display toxic-text mb-4">Analysis History</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest">
            Recorded instances of compound intersection timelines.
          </p>
        </header>

        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="text-center p-12 holo-panel bg-background/40">
              <p className="text-muted-foreground uppercase tracking-widest">
                No timeline anomalies found.
              </p>
            </div>
          ) : (
            history.map((record) => (
              <div
                key={record.id}
                onClick={() => viewResult(record.data)}
                className="holo-panel p-6 bg-background/40 hover:bg-primary/5 transition-all cursor-crosshair group border border-white/5 hover:border-primary/40 block"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors font-display tracking-wider uppercase mb-2">
                      {record.data.headline}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {record.data.normalized.map((n, i) => (
                        <span
                          key={i}
                          className={`text-[10px] px-2 py-0.5 rounded border border-white/10 ${n.found ? "text-primary" : "text-muted-foreground"}`}
                        >
                          {n.found ? n.name : n.input}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] uppercase text-muted-foreground tracking-widest flex items-center gap-1 mb-1 justify-start sm:justify-end">
                        <Clock className="w-3 h-3" />
                        {new Date(record.timestamp).toLocaleString()}
                      </p>
                      <p
                        className={`font-bold tracking-widest uppercase ${record.data.risk === "high" ? "text-destructive" : record.data.risk === "medium" ? "text-amber-500" : "text-emerald-500"}`}
                      >
                        {record.data.risk}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

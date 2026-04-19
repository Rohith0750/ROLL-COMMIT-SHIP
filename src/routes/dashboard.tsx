import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Antigravity from "@/components/Antigravity";
import { LogOut, Zap, Database, Mic, ImagePlus, Keyboard } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("Unknown");

  useEffect(() => {
    const user = localStorage.getItem("chronoUser");
    if (!user) {
      navigate({ to: "/auth", replace: true });
    } else {
      setUsername(user);
    }
  }, [navigate]);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden font-mono-tw text-foreground flex items-center justify-center p-6">
      {/* 3D DISTORTED BACKGROUND */}
      <div className="absolute inset-0 z-0 opacity-40">
        <Antigravity
          count={150}
          magnetRadius={5}
          pulseSpeed={1}
          color="#A855F7" // Purple theme for dashboard
          autoAnimate
        />
      </div>
      <div className="absolute inset-0 z-1 pointer-events-none opacity-20 contrast-150 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="relative z-10 w-full max-w-5xl">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-display uppercase tracking-widest text-primary mb-1">
              OPERATIVE HUB
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Authenticated: {username}
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("chronoUser");
              navigate({ to: "/auth", replace: true });
            }}
            className="mt-4 sm:mt-0 flex items-center gap-2 text-xs uppercase tracking-widest text-destructive hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Terminate Uplink
          </button>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Instructions Panel */}
          <div className="holo-panel p-6 bg-background/60 backdrop-blur-md">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-4 border-b border-white/5 pb-2">
              System Manual
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed mb-6">
              Chrono-Med Discovery is an advanced temporal AI engine designed to intercept
              polypharmacy collisions before they manifest. By normalizing compounds against NIH
              endpoints and referencing absolute OpenFDA telemetry, we prevent catastrophic
              timelines.
            </p>

            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-primary">
                Ingestion Protocols:
              </h3>

              <div className="flex items-start gap-3 p-3 bg-white/5 rounded border border-white/5">
                <Keyboard className="w-5 h-5 text-[var(--brass)] shrink-0" />
                <div>
                  <div className="text-xs font-bold uppercase text-white mb-1">Manual Manifest</div>
                  <div className="text-xs text-muted-foreground">
                    Type compounds directly. Our auto-corrector matches them against RxNorm in
                    real-time.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/5 rounded border border-white/5">
                <ImagePlus className="w-5 h-5 text-[var(--brass)] shrink-0" />
                <div>
                  <div className="text-xs font-bold uppercase text-white mb-1">OCR Scanning</div>
                  <div className="text-xs text-muted-foreground">
                    Drop images of physical prescriptions. The optic engine extracts raw text
                    automatically.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white/5 rounded border border-white/5">
                <Mic className="w-5 h-5 text-[var(--brass)] shrink-0" />
                <div>
                  <div className="text-xs font-bold uppercase text-white mb-1">Vocal Dictation</div>
                  <div className="text-xs text-muted-foreground">
                    Speak symptoms naturally. Built-in Web Speech APIs transcribe audio
                    continuously.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions & Navigation */}
          <div className="space-y-6">
            <div className="holo-panel p-8 bg-primary/10 border-primary/30 hover:border-primary transition-all group cursor-crosshair">
              <div className="text-center">
                <Zap className="w-12 h-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-display uppercase tracking-[0.2em] text-white mb-2">
                  Main Scanner
                </h3>
                <p className="text-xs text-primary/70 mb-6 px-4">
                  Initialize the primary intake screen to begin processing temporal risks.
                </p>
                <button
                  onClick={() => navigate({ to: "/" })}
                  className="w-full py-4 border border-primary text-primary hover:bg-primary hover:text-black transition-colors font-bold uppercase tracking-widest"
                >
                  Launch Scanner
                </button>
              </div>
            </div>

            <div className="holo-panel p-6 bg-background/60 hover:bg-white/5 transition-all text-center">
              <Database className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-1">
                Temporal Archives
              </h3>
              <p className="text-[10px] text-muted-foreground mb-4">
                Review past analyses saved securely to local hardware.
              </p>
              <button
                onClick={() => navigate({ to: "/history" })}
                className="text-xs uppercase tracking-widest text-muted-foreground hover:text-white transition-colors underline decoration-white/20 underline-offset-4"
              >
                Access Archives
              </button>
            </div>
          </div>
        </div>

        <footer className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          ⌬ Secure Connection Established ⌬
        </footer>
      </div>
    </div>
  );
}

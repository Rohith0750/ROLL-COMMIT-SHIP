import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import Antigravity from "@/components/Antigravity";
import { Fingerprint, Lock, Mail, ShieldAlert, Zap } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("chronoUser", "operative_117");
      navigate({ to: "/dashboard" });
    }, 1500);
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden font-mono-tw text-foreground flex items-center justify-center p-6">
      <div className="absolute inset-0 z-0">
        <Antigravity
          count={100}
          magnetRadius={8}
          ringRadius={15}
          color="#FF2a2a" // Threat red color for auth
          autoAnimate
          fieldStrength={8}
        />
      </div>
      <div className="absolute inset-0 z-1 pointer-events-none opacity-20 contrast-150 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="holo-panel p-8 backdrop-blur-xl bg-background/50 border border-white/5">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-full border-2 border-destructive/40 flex items-center justify-center mb-4 neon-pulse">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <h1
              className="text-2xl font-display uppercase tracking-widest text-white mb-2 glitch flicker"
              data-text="RESTRICTED ACCESS"
            >
              RESTRICTED ACCESS
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Temporal authentication required
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  required
                  type="text"
                  placeholder="Operative ID or Email"
                  className="w-full bg-[var(--input)] border border-[var(--brass)]/40 rounded p-3 pl-10 font-mono-tw text-sm text-foreground focus:outline-none focus:border-destructive focus:shadow-[0_0_15px_rgba(255,0,0,0.3)] transition"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  required
                  type="password"
                  placeholder="Access Passcode"
                  className="w-full bg-[var(--input)] border border-[var(--brass)]/40 rounded p-3 pl-10 font-mono-tw text-sm text-foreground focus:outline-none focus:border-destructive focus:shadow-[0_0_15px_rgba(255,0,0,0.3)] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden px-8 py-3 bg-transparent hover:bg-destructive/10 border border-destructive text-destructive transition-all duration-300 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-destructive/10 translate-y-full group-hover:translate-y-0 transition-transform" />
              <div className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <span className="font-display tracking-[0.2em] text-sm animate-pulse">
                    VERIFYING BIOMETRICS...
                  </span>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    <span className="font-display tracking-[0.2em] text-sm">
                      {isLogin ? "INITIALIZE UPLINK" : "REQUEST CLEARANCE"}
                    </span>
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-white transition"
            >
              {isLogin ? "No clearance? Register here." : "Have clearance? Return to uplink."}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

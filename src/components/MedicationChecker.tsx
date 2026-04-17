import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  AudioWaveform,
  Cpu,
  Eye,
  FileText,
  FlaskConical,
  ImagePlus,
  MessageSquareText,
  Mic,
  MicOff,
  Pill,
  Play,
  Radar,
  Scan,
  ShieldCheck,
  Skull,
  X,
  Zap,
} from "lucide-react";
import { TimeVortex } from "./TimeVortex";
import { Waveform } from "./Waveform";
import { RiskGauge } from "./RiskGauge";
import { TimelineSlider } from "./TimelineSlider";
import { Particles } from "./Particles";
import {
  analyzeDrugs,
  ocrPrescription,
  suggestDrugs,
  type AnalysisResult,
  type Risk,
} from "@/server/drug-analysis";

type Result = AnalysisResult;

// Web Speech API (best-effort, local)
type SpeechRecognitionLike = {
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
};

export function MedicationChecker() {
  const [compounds, setCompounds] = useState("");
  const [problem, setProblem] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [timeline, setTimeline] = useState(50);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Image upload
  const handleImage = (file?: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    // Read as base64 and run OCR
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || "");
      const base64 = dataUrl.split(",")[1] || "";
      if (!base64) return;
      setScanning(true);
      try {
        const out = await ocrPrescription({
          data: { imageBase64: base64, mimeType: file.type || "image/jpeg" },
        });
        if (out.compounds.length) {
          setCompounds((c) => (c ? c + ", " : "") + out.compounds.join(", "));
        } else if (out.text) {
          setCompounds((c) => (c ? c + "\n" : "") + out.text.slice(0, 300));
        }
      } catch (err) {
        console.error("OCR error", err);
        alert(`OCR failed: ${err instanceof Error ? err.message : "unknown error"}`);
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Voice input
  const toggleVoice = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input not supported in this browser.");
      return;
    }
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript + " ";
      setCompounds((c) => (c ? c + ", " : "") + transcript.trim());
    };
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  };

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const runAnalysis = async () => {
    if (!compounds.trim() && !problem.trim()) {
      setResult({
        risk: "low",
        headline: "// awaiting input //",
        lines: ["No compounds detected on the temporal scanner."],
        normalized: [],
        interactions: [],
        warnings: [],
      });
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const out = await analyzeDrugs({ data: { compounds, problem } });
      setResult(out);
    } catch (err) {
      console.error("Analysis error", err);
      setResult({
        risk: "high",
        headline: "✕ TEMPORAL LINK SEVERED",
        lines: [
          "analysis engine unreachable…",
          err instanceof Error ? err.message : "unknown error",
        ],
        normalized: [],
        interactions: [],
        warnings: [],
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="relative min-h-screen scanlines">
      <Particles count={28} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* HEADER */}
        <header className="holo-panel p-5 sm:p-7 flex items-center gap-5 mb-6">
          <TimeVortex />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground mb-1">
              <Cpu className="w-3.5 h-3.5 amber-text" />
              <span>Chrono-Pharma Unit · Mk IV</span>
              <Activity className="w-3.5 h-3.5 toxic-text ml-auto sm:ml-2" />
              <span className="toxic-text">SYS · ONLINE</span>
            </div>
            <h1
              className="font-display text-2xl sm:text-4xl neon-text glitch flicker leading-tight"
              data-text="Medication Conflict Checker"
            >
              Medication Conflict Checker
            </h1>
            <p className="font-mono-tw text-xs sm:text-sm text-muted-foreground mt-1">
              ⟶ Temporal Analysis Engine · v1.2.0-β
            </p>
          </div>
          <div className="hidden sm:block brass px-3 py-2 rounded-md text-xs">
            <div className="opacity-80">PORT</div>
            <div className="font-bold">07-A</div>
          </div>
        </header>

        {/* INPUTS GRID */}
        <div className="grid lg:grid-cols-3 gap-5 mb-6">
          {/* TEXT INPUT */}
          <section className="holo-panel p-5 lg:col-span-2">
            <SectionTitle icon={<FileText className="w-4 h-4" />} label="Compound Manifest" hint="text" />
            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
              <Pill className="w-4 h-4 neon-text" />
              <FlaskConical className="w-4 h-4 toxic-text" />
              <span>medicines · supplements · chemicals</span>
            </div>
            <div className="relative">
              <textarea
                value={compounds}
                onChange={(e) => setCompounds(e.target.value)}
                rows={4}
                placeholder="Enter compounds across timelines..."
                className="w-full bg-[var(--input)] border border-[var(--brass)]/40 rounded-md p-3 font-mono-tw text-sm
                  text-foreground placeholder:text-muted-foreground/70
                  focus:outline-none focus:border-[var(--neon)] focus:shadow-[0_0_18px_var(--neon)]/40 transition"
              />
              <div className="absolute top-2 right-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                {compounds.length} ch
              </div>
            </div>
          </section>

          {/* IMAGE UPLOAD */}
          <section className="holo-panel p-5">
            <SectionTitle icon={<ImagePlus className="w-4 h-4" />} label="Prescription Scan" hint="image" />
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => handleImage(e.target.files?.[0])}
            />
            {!imageUrl ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-[var(--brass)]/50 rounded-md
                  flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground
                  hover:border-[var(--neon)] hover:text-foreground hover:shadow-[0_0_14px_var(--neon)]/30 transition"
              >
                <ImagePlus className="w-7 h-7 amber-text" />
                <span>Drop / Upload</span>
                <span className="text-[10px] uppercase tracking-widest">.jpg · .png</span>
              </button>
            ) : (
              <div className="relative h-40 rounded-md overflow-hidden border border-[var(--neon)]/40">
                <img src={imageUrl} alt="prescription" className="w-full h-full object-cover" />
                {scanning && <div className="scan-beam" style={{ top: 0 }} />}
                <div className="absolute inset-0 bg-[var(--neon)]/10 mix-blend-overlay pointer-events-none" />
                <button
                  onClick={() => {
                    URL.revokeObjectURL(imageUrl);
                    setImageUrl(null);
                  }}
                  className="absolute top-2 right-2 p-1 rounded bg-background/70 border border-destructive/50 text-destructive"
                  aria-label="remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] uppercase tracking-widest">
                  {scanning ? (
                    <>
                      <Scan className="w-3.5 h-3.5 toxic-text" /> <span className="toxic-text">scanning…</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 neon-text" /> <span className="neon-text">preview ready</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* VOICE INPUT */}
          <section className="holo-panel p-5 lg:col-span-2">
            <SectionTitle
              icon={<AudioWaveform className="w-4 h-4" />}
              label="Vocal Channel"
              hint="speech → text"
            />
            <div className="flex items-center gap-4">
              <button
                onClick={toggleVoice}
                className={`brass relative w-16 h-16 rounded-full flex items-center justify-center transition
                  ${recording ? "neon-pulse" : ""}`}
                aria-label="toggle voice"
              >
                {recording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                {recording && (
                  <span className="absolute inset-0 rounded-full border-2 border-[var(--toxic)] animate-ping" />
                )}
              </button>
              <div className="flex-1">
                <Waveform active={recording} />
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                  {recording ? (
                    <span className="toxic-text">▶ recording · speak now</span>
                  ) : (
                    <span>tap mic to dictate compounds</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* PROBLEM DESCRIPTION */}
          <section className="holo-panel p-5 lg:col-span-3">
            <SectionTitle
              icon={<MessageSquareText className="w-4 h-4" />}
              label="Symptom Log"
              hint="describe concerns"
            />
            <div className="relative">
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                rows={3}
                placeholder="Describe symptoms or concerns..."
                className="w-full bg-[var(--input)] border border-[var(--brass)]/40 rounded-md p-3 font-mono-tw text-sm
                  text-foreground placeholder:text-muted-foreground/70
                  focus:outline-none focus:border-[var(--toxic)] focus:shadow-[0_0_18px_var(--toxic)]/40 transition"
              />
              <div className="absolute top-2 right-3 flex items-center gap-1 text-[10px] uppercase tracking-widest amber-text">
                <AlertTriangle className="w-3 h-3" />
                report honestly
              </div>
            </div>
          </section>
        </div>

        {/* ACTION BUTTON */}
        <div className="flex justify-center mb-8">
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="group relative neon-pulse brass px-8 sm:px-12 py-4 rounded-full font-display text-sm sm:text-base
              uppercase tracking-[0.25em] flex items-center gap-3 disabled:opacity-70"
          >
            {analyzing ? (
              <>
                <Radar className="w-5 h-5 animate-spin" />
                Scanning timelines…
                <span
                  className="absolute inset-0 rounded-full radar-sweep opacity-50 mix-blend-screen"
                  aria-hidden
                />
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Analyze Timeline
                <Play className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* OUTPUT + GAUGES */}
        <div className="grid lg:grid-cols-3 gap-5">
          <section className="holo-panel p-5 lg:col-span-2 min-h-[260px] relative overflow-hidden">
            <SectionTitle
              icon={<Activity className="w-4 h-4" />}
              label="Analysis Readout"
              hint="distorted feed"
            />
            {!result && !analyzing && (
              <div className="text-muted-foreground text-sm italic mt-4">
                // standby · awaiting temporal scan //
              </div>
            )}
            {analyzing && (
              <div className="mt-6 space-y-2 animate-pulse">
                <div className="h-3 w-2/3 bg-[var(--muted)] rounded" />
                <div className="h-3 w-1/2 bg-[var(--muted)] rounded" />
                <div className="h-3 w-3/4 bg-[var(--muted)] rounded" />
              </div>
            )}
            {result && <Readout result={result} />}
          </section>

          <div className="space-y-5">
            <RiskGauge level={result?.risk ?? "low"} />
            <TimelineSlider value={timeline} onChange={setTimeline} />
          </div>
        </div>

        <footer className="mt-10 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          ⌬ For demonstration only · not medical advice ⌬
        </footer>
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 amber-text text-xs uppercase tracking-[0.25em]">
        {icon}
        {label}
      </div>
      {hint && (
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">[{hint}]</div>
      )}
    </div>
  );
}

function Readout({ result }: { result: Result }) {
  const Icon = result.risk === "high" ? Skull : result.risk === "medium" ? AlertOctagon : ShieldCheck;
  const color =
    result.risk === "high"
      ? "text-destructive"
      : result.risk === "medium"
        ? "amber-text"
        : "toxic-text";

  return (
    <div className="mt-3 font-mono-tw">
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`w-7 h-7 ${color}`} />
        <h2
          className={`font-display text-lg sm:text-2xl glitch flicker ${color}`}
          data-text={result.headline}
        >
          {result.headline}
        </h2>
      </div>
      <ul className="space-y-2 text-sm">
        {result.lines.map((line, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-foreground/90"
            style={{ animation: `fade-in 0.5s ease-out ${i * 150}ms both` }}
          >
            <span className="amber-text mt-1">›</span>
            <span className="flicker">{line}</span>
          </li>
        ))}
      </ul>

      {result.normalized.length > 0 && (
        <div className="mt-5">
          <div className="text-[10px] uppercase tracking-[0.25em] amber-text mb-2">
            ⟶ normalized compounds (rxnorm)
          </div>
          <div className="flex flex-wrap gap-2">
            {result.normalized.map((n, i) => (
              <span
                key={i}
                className={`px-2 py-1 rounded border text-[11px] font-mono-tw ${
                  n.found
                    ? "border-[var(--neon)]/50 neon-text"
                    : "border-destructive/50 text-destructive"
                }`}
                title={n.rxcui ? `RxCUI ${n.rxcui}` : "not found"}
              >
                {n.found ? n.name : `? ${n.input}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.interactions.length > 0 && (
        <div className="mt-5">
          <div className="text-[10px] uppercase tracking-[0.25em] amber-text mb-2">
            ⟶ documented interactions (openfda)
          </div>
          <ul className="space-y-2">
            {result.interactions.map((i, idx) => (
              <li
                key={idx}
                className={`border-l-2 pl-3 text-xs ${
                  i.severity === "high"
                    ? "border-destructive"
                    : i.severity === "medium"
                      ? "border-[var(--amber)]"
                      : "border-[var(--toxic)]"
                }`}
              >
                <div className="font-display tracking-wider">
                  <span className="neon-text">{i.a}</span> ⇄ <span className="neon-text">{i.b}</span>{" "}
                  <span className="text-muted-foreground">[{i.severity}]</span>
                </div>
                <div className="text-foreground/70 mt-1">{i.description}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="mt-5">
          <div className="text-[10px] uppercase tracking-[0.25em] amber-text mb-2">
            ⟶ label warnings
          </div>
          <ul className="space-y-2 text-xs">
            {result.warnings.map((w, idx) => (
              <li key={idx} className="border border-[var(--brass)]/30 rounded p-2">
                <div className="neon-text font-display tracking-wider mb-1">{w.drug}</div>
                {w.warnings.map((line, j) => (
                  <p key={`w${j}`} className="text-foreground/70">
                    ⚠ {line}
                  </p>
                ))}
                {w.contraindications.map((line, j) => (
                  <p key={`c${j}`} className="text-destructive/80 mt-1">
                    ⊘ {line}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        <div className="border border-[var(--brass)]/30 rounded p-2 text-center">
          <div className="neon-text">{result.normalized.length}</div>scanned
        </div>
        <div className="border border-[var(--brass)]/30 rounded p-2 text-center">
          <div className="toxic-text">{result.interactions.length}</div>conflicts
        </div>
        <div className="border border-[var(--brass)]/30 rounded p-2 text-center">
          <div className="amber-text">{result.warnings.length}</div>warnings
        </div>
      </div>
    </div>
  );
}

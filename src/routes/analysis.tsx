import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import Antigravity from "@/components/Antigravity";
import { type AnalysisResult, type Risk } from "@/server/drug-analysis";
import {
  Activity,
  AlertOctagon,
  ChevronLeft,
  Download,
  ShieldCheck,
  Skull,
  Zap,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/analysis")({
  component: AnalysisPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      result: search.result as string | undefined,
    };
  },
});

function AnalysisPage() {
  const { result: resultRaw } = useSearch({ from: "/analysis" });
  const navigate = useNavigate();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (resultRaw) {
      try {
        const parsed = JSON.parse(resultRaw);
        setResult(parsed);

        // Save to temporal archives
        const savedHistory = localStorage.getItem("chronoMedHistory");
        let historyArray = savedHistory ? JSON.parse(savedHistory) : [];
        if (
          historyArray.length === 0 ||
          JSON.stringify(historyArray[0].data) !== JSON.stringify(parsed)
        ) {
          historyArray.unshift({
            id: Math.random().toString(36).slice(2, 9).toUpperCase(),
            timestamp: new Date().toISOString(),
            data: parsed,
          });
          if (historyArray.length > 20) historyArray = historyArray.slice(0, 20);
          localStorage.setItem("chronoMedHistory", JSON.stringify(historyArray));
        }
      } catch (e) {
        console.error("Failed to parse analysis result", e);
      }
    }
  }, [resultRaw]);

  const handleDownloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF();

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(82, 39, 255); // Primary color
    doc.text("CHRONO-MED DISCOVERY", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Timeline Resolution ID: " + Math.random().toString(36).slice(2, 9).toUpperCase(),
      14,
      28,
    );

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Risk Index: ${result.risk.toUpperCase()}`, 14, 40);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Headline:", 14, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const splitHeadline = doc.splitTextToSize(result.headline, 180);
    doc.text(splitHeadline, 14, 58);

    let currentY = 58 + splitHeadline.length * 6 + 10;

    // Readout
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Clinical Readout:", 14, currentY);
    currentY += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    result.lines.forEach((line) => {
      const splitLine = doc.splitTextToSize(`• ${line}`, 180);
      doc.text(splitLine, 14, currentY);
      currentY += splitLine.length * 5;
    });

    currentY += 10;
    if (result.interactions.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Detected Conflicts:", 14, currentY);
      currentY += 8;

      const tableData = result.interactions.map((i) => [
        `${i.a} <=> ${i.b}`,
        i.severity.toUpperCase(),
        i.description,
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [["Interaction", "Severity", "Description"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [82, 39, 255] },
      });
    }

    doc.save("chrono_med_report.pdf");
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-mono-tw text-muted-foreground animate-pulse">
        // DETECTING TEMPORAL DATA... //
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden font-mono-tw">
      {/* 3D DISTORTED BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <Antigravity
          count={400}
          magnetRadius={8}
          ringRadius={8}
          waveSpeed={0.6}
          waveAmplitude={1.5}
          particleSize={1.2}
          lerpSpeed={0.04}
          color="#5227FF"
          autoAnimate
          fieldStrength={15}
        />
      </div>

      {/* NOISE OVERLAY */}
      <div className="absolute inset-0 z-1 pointer-events-none opacity-20 contrast-150 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
          <button
            onClick={() => navigate({ to: "/" })}
            className="group flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Scanner
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary border border-primary/30 bg-primary/10 px-4 py-2 rounded hover:bg-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4 flicker" />
            Download PDF Report
          </button>
        </div>

        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-[10px] uppercase tracking-[0.3em] text-primary mb-4 animate-in fade-in slide-in-from-bottom-4">
            <Zap className="w-3 h-3" />
            Analysis Verified
          </div>
          <h1
            className="text-4xl sm:text-6xl font-display neon-text glitch flicker mb-2"
            data-text={result.headline}
          >
            {result.headline}
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-[0.2em]">
            Timeline Resolution · ID: {Math.random().toString(36).slice(2, 9).toUpperCase()}
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <section className="holo-panel p-6 backdrop-blur-xl bg-background/40 blur-[3px] hover:blur-none opacity-70 hover:opacity-100 transition-all duration-700 cursor-crosshair">
              <div className="flex items-center gap-3 mb-6">
                <RiskIcon risk={result.risk} className="w-8 h-8" />
                <h2 className="text-xl font-display uppercase tracking-wider">Clinical Readout</h2>
              </div>

              <ul className="space-y-4">
                {result.lines.map((line, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-foreground/90 leading-relaxed border-b border-white/5 pb-3 last:border-0"
                    style={{ animation: `fade-in 0.5s ease-out ${i * 100}ms both` }}
                  >
                    <span className="text-primary mt-1 flicker">⌬</span>
                    <span
                      className="glitch opacity-90 transition-opacity hover:opacity-100"
                      data-text={line}
                    >
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {result.interactions.length > 0 && (
              <section className="holo-panel p-6 backdrop-blur-xl bg-background/40 border-primary/20 blur-[3px] hover:blur-none opacity-70 hover:opacity-100 transition-all duration-700 cursor-crosshair">
                <h3 className="text-xs uppercase tracking-[0.3em] text-primary mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 flicker" />
                  Detected Conflicts
                </h3>
                <div className="space-y-4">
                  {result.interactions.map((i, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded border border-white/5 bg-white/5 hover:bg-white/10 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm glitch" data-text={`${i.a} ⇄ ${i.b}`}>
                          {i.a} ⇄ {i.b}
                        </span>
                        <span
                          className={`text-[10px] uppercase px-2 py-0.5 rounded ${getRiskColor(i.severity)} flicker`}
                        >
                          {i.severity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground glitch" data-text={i.description}>
                        {i.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <div
              className={`holo-panel p-6 text-center border-2 ${getRiskBorder(result.risk)} blur-[3px] hover:blur-none opacity-70 hover:opacity-100 transition-all duration-700 cursor-crosshair`}
            >
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                Risk Index
              </div>
              <RiskIcon
                risk={result.risk}
                className={`w-16 h-16 mx-auto mb-4 ${getRiskText(result.risk)}`}
              />
              <div className={`text-2xl font-display uppercase ${getRiskText(result.risk)}`}>
                {result.risk}
              </div>
            </div>

            <div className="holo-panel p-6 bg-primary/5 blur-[3px] hover:blur-none opacity-70 hover:opacity-100 transition-all duration-700 cursor-crosshair">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                Compounds
              </div>
              <div className="flex flex-wrap gap-2">
                {result.normalized.map((n, i) => (
                  <span
                    key={i}
                    className={`text-[10px] px-2 py-1 rounded border ${n.found ? "border-primary/40 text-primary" : "border-destructive/40 text-destructive"}`}
                  >
                    {n.found ? n.name : n.input}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function RiskIcon({ risk, className }: { risk: Risk; className?: string }) {
  if (risk === "high") return <Skull className={className} />;
  if (risk === "medium") return <AlertOctagon className={className} />;
  return <ShieldCheck className={className} />;
}

function getRiskColor(risk: Risk) {
  if (risk === "high") return "bg-destructive/20 text-destructive";
  if (risk === "medium") return "bg-amber-500/20 text-amber-500";
  return "bg-emerald-500/20 text-emerald-500";
}

function getRiskText(risk: Risk) {
  if (risk === "high") return "text-destructive neon-text";
  if (risk === "medium") return "amber-text";
  return "toxic-text";
}

function getRiskBorder(risk: Risk) {
  if (risk === "high") return "border-destructive/50";
  if (risk === "medium") return "border-amber-500/50";
  return "border-emerald-500/50";
}

import { createServerFn } from "@tanstack/react-start";

// ===== Types =====
export type Risk = "low" | "medium" | "high";

export type NormalizedDrug = {
  input: string;
  name: string | null; // canonical name from RxNorm
  rxcui: string | null;
  found: boolean;
};

export type InteractionPair = {
  a: string;
  b: string;
  severity: Risk;
  description: string;
  source: "openfda";
};

export type DrugWarning = {
  drug: string;
  warnings: string[];
  contraindications: string[];
};

export type AnalysisResult = {
  risk: Risk;
  headline: string;
  lines: string[];
  normalized: NormalizedDrug[];
  interactions: InteractionPair[];
  warnings: DrugWarning[];
};

// ===== Helpers =====
function splitCompounds(raw: string): string[] {
  return raw
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
    .slice(0, 12);
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", ...(init?.headers || {}) },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// RxNorm normalization → canonical name + rxcui
async function normalizeDrug(name: string): Promise<NormalizedDrug> {
  const q = encodeURIComponent(name);
  // Try approximate match first (handles typos)
  const approx = await fetchJson<{
    approximateGroup?: { candidate?: { rxcui: string; name?: string }[] };
  }>(`https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${q}&maxEntries=1`);

  const cand = approx?.approximateGroup?.candidate?.[0];
  if (cand?.rxcui) {
    // Get canonical name
    const props = await fetchJson<{ properties?: { name?: string } }>(
      `https://rxnav.nlm.nih.gov/REST/rxcui/${cand.rxcui}/properties.json`,
    );
    return {
      input: name,
      name: props?.properties?.name ?? cand.name ?? name,
      rxcui: cand.rxcui,
      found: true,
    };
  }
  return { input: name, name: null, rxcui: null, found: false };
}

// openFDA drug label lookup
async function fetchLabel(drugName: string): Promise<{
  warnings: string[];
  contraindications: string[];
  interactionsText: string;
} | null> {
  const q = encodeURIComponent(
    `openfda.generic_name:"${drugName}" OR openfda.brand_name:"${drugName}"`,
  );
  const data = await fetchJson<{
    results?: Array<{
      warnings?: string[];
      warnings_and_cautions?: string[];
      contraindications?: string[];
      drug_interactions?: string[];
    }>;
  }>(`https://api.fda.gov/drug/label.json?search=${q}&limit=1`);

  const r = data?.results?.[0];
  if (!r) return null;
  const warnings = [...(r.warnings || []), ...(r.warnings_and_cautions || [])];
  return {
    warnings: warnings.slice(0, 1).map((w) => truncate(w, 400)),
    contraindications: (r.contraindications || []).slice(0, 1).map((w) => truncate(w, 400)),
    interactionsText: (r.drug_interactions || []).join(" \n ").toLowerCase(),
  };
}

function truncate(s: string, n: number) {
  s = s.replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function severityFromText(text: string): Risk {
  const t = text.toLowerCase();
  if (
    /(contraindicat|fatal|life-threatening|severe|do not (use|administer)|avoid concomitant)/.test(
      t,
    )
  )
    return "high";
  if (/(caution|monitor|may increase|may decrease|moderate)/.test(t)) return "medium";
  return "low";
}

// ===== Server Function: Analyze =====
export const analyzeDrugs = createServerFn({ method: "POST" })
  .inputValidator((input: { compounds: string; problem?: string }) => {
    if (typeof input?.compounds !== "string") throw new Error("compounds must be a string");
    return {
      compounds: input.compounds.slice(0, 2000),
      problem: (input.problem || "").slice(0, 1000),
    };
  })
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const items = splitCompounds(data.compounds);
    if (items.length === 0) {
      return {
        risk: "low",
        headline: "// awaiting input //",
        lines: ["No compounds detected on the temporal scanner."],
        normalized: [],
        interactions: [],
        warnings: [],
      };
    }

    // 1. Normalize all
    const normalized = await Promise.all(items.map((n) => normalizeDrug(n)));
    const valid = normalized.filter((n) => n.found && n.name);

    // 2. Pull labels for each
    const labels = await Promise.all(
      valid.map(async (d) => ({
        drug: d.name as string,
        label: await fetchLabel(d.name as string),
      })),
    );

    // 3. Build warnings list
    const warnings: DrugWarning[] = labels
      .filter((x) => x.label)
      .map((x) => ({
        drug: x.drug,
        warnings: x.label!.warnings,
        contraindications: x.label!.contraindications,
      }));

    // 4. Cross-check interactions: scan each label's drug_interactions text for the OTHER drug names
    const interactions: InteractionPair[] = [];
    for (const item of labels) {
      if (!item.label) continue;
      const text = item.label.interactionsText;
      for (const other of valid) {
        const otherName = (other.name as string).toLowerCase();
        if (otherName === item.drug.toLowerCase()) continue;
        // Use first word of canonical name as fallback (e.g. "warfarin sodium" → "warfarin")
        const root = otherName.split(/\s+/)[0];
        if (text.includes(otherName) || (root.length > 4 && text.includes(root))) {
          // Extract a sentence containing the match
          const idx = text.indexOf(text.includes(otherName) ? otherName : root);
          const snippet = text.slice(Math.max(0, idx - 120), idx + 240);
          const description = truncate(snippet, 320);
          const severity = severityFromText(snippet);
          // Avoid duplicates (a↔b)
          const exists = interactions.find(
            (i) =>
              (i.a === item.drug && i.b === other.name) ||
              (i.a === other.name && i.b === item.drug),
          );
          if (!exists) {
            interactions.push({
              a: item.drug,
              b: other.name as string,
              severity,
              description,
              source: "openfda",
            });
          }
        }
      }
    }

    // 5. Determine overall risk
    let risk: Risk = "low";
    if (interactions.some((i) => i.severity === "high")) risk = "high";
    else if (interactions.some((i) => i.severity === "medium") || valid.length >= 4)
      risk = "medium";

    // Symptom keyword bump
    const probLower = (data.problem || "").toLowerCase();
    if (/bleed|chest pain|seizure|black ?out|faint|breath/.test(probLower) && risk !== "high")
      risk = risk === "low" ? "medium" : "high";

    // --- NEW: Groq AI Enhancement ---
    const apiKey = process.env.VITE_GROQ_API_KEY;
    if (apiKey && valid.length > 0) {
      try {
        const groqResult = await analyzeWithGroq(
          apiKey,
          valid.map((v) => v.name as string),
          labels.map((l) => ({ drug: l.drug, text: l.label?.interactionsText || "" })),
          data.problem || "",
        );

        if (groqResult) {
          return {
            risk: groqResult.risk,
            headline: groqResult.headline,
            lines: groqResult.lines,
            normalized,
            interactions: groqResult.interactions.map(
              (i: { a: string; b: string; severity: Risk; description: string }) => ({
                ...i,
                source: "openfda",
              }),
            ),
            warnings,
          };
        }
      } catch (err) {
        console.warn("Groq AI analysis failed, using heuristic fallback:", err);
      }
    }
    // --- End Groq AI ---

    const headline =
      risk === "high"
        ? "⚠ TEMPORAL COLLISION DETECTED"
        : risk === "medium"
          ? "◐ MINOR ANOMALY OBSERVED"
          : "✓ TIMELINE STABLE";

    const lines: string[] = [];
    if (interactions.length === 0 && valid.length > 0) {
      lines.push(`scanned ${valid.length} compound(s) across rxnorm + openfda…`);
      lines.push("no documented interactions detected in current corpus.");
    } else {
      for (const i of interactions.slice(0, 4)) {
        lines.push(`${i.a} ⇄ ${i.b} :: ${i.description}`);
      }
    }
    const unknown = normalized.filter((n) => !n.found).map((n) => n.input);
    if (unknown.length) lines.push(`unrecognized compounds: ${unknown.join(", ")}`);

    return { risk, headline, lines, normalized, interactions, warnings };
  });

// Groq AI Integration Helper
async function analyzeWithGroq(
  apiKey: string,
  drugNames: string[],
  fdaTexts: { drug: string; text: string }[],
  problem: string,
) {
  const prompt = `
You are the CHRONO-MED AI, a clinical pharmacology engine.
Analyze the following drugs and the patient's reported problem.
Drugs: ${drugNames.join(", ")}
Symptom Context: ${problem}

FDA Interaction Data Source:
${fdaTexts.map((f) => `[${f.drug}]: ${f.text.slice(0, 1500)}`).join("\n\n")}

Evaluate the risk of interaction.
Return ONLY a JSON object with this structure:
{
  "risk": "high" | "medium" | "low",
  "headline": "Short futuristic/clinical title (max 40 chars)",
  "lines": ["3-4 bullet points summarizing the danger or safety"],
  "interactions": [
    { "a": "Drug A", "b": "Drug B", "severity": "high"|"medium"|"low", "description": "concise explanation" }
  ]
}
`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;
  return JSON.parse(content);
}

// ===== Server Function: OCR via OCR.Space =====
export const ocrPrescription = createServerFn({ method: "POST" })
  .inputValidator((input: { imageBase64: string; mimeType?: string }) => {
    if (typeof input?.imageBase64 !== "string" || input.imageBase64.length < 50)
      throw new Error("imageBase64 required");
    if (input.imageBase64.length > 7_000_000) throw new Error("image too large (max ~5MB)");
    return { imageBase64: input.imageBase64, mimeType: input.mimeType || "image/jpeg" };
  })
  .handler(async ({ data }): Promise<{ text: string; compounds: string[] }> => {
    const apiKey = process.env.VITE_OCR_SPACE_API_KEY;
    if (!apiKey) throw new Error("OCR_SPACE_API_KEY is not configured");

    const dataUrl = `data:${data.mimeType};base64,${data.imageBase64}`;
    const form = new FormData();
    form.append("base64Image", dataUrl);
    form.append("language", "eng");
    form.append("isTable", "true");
    form.append("OCREngine", "2");
    form.append("scale", "true");

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { apikey: apiKey },
      body: form,
    });
    const json = (await res.json()) as {
      ParsedResults?: { ParsedText?: string }[];
      IsErroredOnProcessing?: boolean;
      ErrorMessage?: string | string[];
    };
    if (!res.ok || json.IsErroredOnProcessing) {
      const msg = Array.isArray(json.ErrorMessage)
        ? json.ErrorMessage.join("; ")
        : json.ErrorMessage;
      throw new Error(`OCR failed [${res.status}]: ${msg || "unknown"}`);
    }
    const text = (json.ParsedResults || [])
      .map((r) => r.ParsedText || "")
      .join("\n")
      .trim();

    // Heuristic compound extraction: capitalised words / lines, drop common stopwords
    const stop = new Set([
      "rx",
      "tab",
      "tabs",
      "cap",
      "caps",
      "tablet",
      "tablets",
      "capsule",
      "mg",
      "ml",
      "mcg",
      "daily",
      "twice",
      "thrice",
      "morning",
      "night",
      "evening",
      "before",
      "after",
      "food",
      "patient",
      "name",
      "age",
      "doctor",
      "dr",
      "date",
      "sig",
      "qty",
      "refill",
    ]);
    const candidates = new Set<string>();
    for (const raw of text.split(/[\n,;]+/)) {
      const line = raw.trim();
      if (!line) continue;
      // Strip dosage/quantities
      const cleaned = line
        .replace(/\d+\s?(mg|ml|mcg|g|iu|%)/gi, "")
        .replace(/[^A-Za-z\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      // Take first 1-2 word token of length >= 4
      const tokens = cleaned.split(" ").filter((t) => t.length >= 4 && !stop.has(t.toLowerCase()));
      if (tokens.length > 0) {
        const guess = tokens.slice(0, 1).join(" ");
        if (guess.length >= 4) candidates.add(guess);
      }
    }
    return { text, compounds: Array.from(candidates).slice(0, 10) };
  });

// ===== Server Function: Drug name suggestions (RxNorm) =====
export const suggestDrugs = createServerFn({ method: "POST" })
  .inputValidator((input: { query: string }) => {
    if (typeof input?.query !== "string") throw new Error("query must be a string");
    return { query: input.query.slice(0, 60).trim() };
  })
  .handler(async ({ data }): Promise<{ suggestions: string[] }> => {
    const q = data.query;
    if (q.length < 2) return { suggestions: [] };
    const enc = encodeURIComponent(q);

    // Run spellingsuggestions + approximateTerm in parallel
    const [spell, approx] = await Promise.all([
      fetchJson<{ suggestionGroup?: { suggestionList?: { suggestion?: string[] } } }>(
        `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${enc}`,
      ),
      fetchJson<{ approximateGroup?: { candidate?: { rxcui: string; name?: string }[] } }>(
        `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${enc}&maxEntries=8`,
      ),
    ]);

    const out = new Set<string>();
    for (const s of spell?.suggestionGroup?.suggestionList?.suggestion ?? []) {
      if (s) out.add(s);
    }

    // Resolve approximate rxcuis to canonical names (cap to 5 lookups)
    const cands = (approx?.approximateGroup?.candidate ?? []).slice(0, 5);
    const props = await Promise.all(
      cands.map((c) =>
        fetchJson<{ properties?: { name?: string } }>(
          `https://rxnav.nlm.nih.gov/REST/rxcui/${c.rxcui}/properties.json`,
        ),
      ),
    );
    for (const p of props) {
      const n = p?.properties?.name;
      if (n) out.add(n);
    }

    return { suggestions: Array.from(out).slice(0, 8) };
  });

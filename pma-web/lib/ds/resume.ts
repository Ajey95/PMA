import Groq from "groq-sdk";
import { ResumeAnalyzeResponse } from "@/lib/types";
import { log, startTimer } from "@/lib/logger";

const GROQ_MODEL = "llama-3.3-70b-versatile";

// ── Few-shot examples for structured output reliability ──────────────────────

const FEW_SHOT_EXAMPLE = `
EXAMPLE INPUT:
Resume: Senior ML Engineer with 6 years experience. Python, PyTorch, TensorFlow, distributed training, LLM fine-tuning, MLflow, Kubernetes. Led team of 4, deployed 3 production models serving 10M+ users.
JD: Staff ML Engineer at Cohere. Must have 5+ years ML, strong Python, LLM pre-training/fine-tuning experience, distributed systems, and the ability to lead technical projects.

EXAMPLE OUTPUT:
{
  "score": 88,
  "summary": "Strong match. Candidate meets all core requirements and brings relevant production-scale experience, though staff-level leadership expectations may require additional evidence.",
  "strengths": [
    "6 years ML engineering experience meets the 5+ year requirement comfortably.",
    "Direct LLM fine-tuning experience is a perfect match for Cohere's core work.",
    "Led a team of 4 and managed production deployments showing staff-level capability.",
    "Python, PyTorch, and distributed systems are explicitly required and present."
  ],
  "gaps": [
    "No mention of pre-training experience, which Cohere specifically emphasizes.",
    "Kubernetes is present but cloud-scale infrastructure depth is unclear."
  ],
  "suggestions": [
    "Add specific examples of LLM pre-training experiments or research contributions.",
    "Quantify the business impact of the 3 production models (e.g., revenue, latency reduction).",
    "Highlight cross-functional leadership stories that demonstrate staff-level scope."
  ],
  "extractedKeywords": ["LLM", "fine-tuning", "pre-training", "Python", "distributed systems", "PyTorch", "staff", "production", "ML engineering"]
}
`.trim();

// ── Groq-powered resume analysis ─────────────────────────────────────────────

export async function analyzeResumeAgainstJd(
  resumeText: string,
  jdText: string
): Promise<ResumeAnalyzeResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  const timer = startTimer();

  if (!apiKey) {
    log.warn("[resume] GROQ_API_KEY not set — using keyword-based fallback");
    return keywordFallback(resumeText, jdText);
  }

  const groq = new Groq({ apiKey });

  const systemPrompt = `You are a senior technical recruiter and career coach with 15 years of experience.
Analyze the candidate's resume against the job description below with precision and actionable specificity.

Return ONLY a valid JSON object (no markdown, no explanation) matching this exact schema:
{
  "score": number (0-100, be accurate and honest — don't inflate),
  "summary": string (2 sentences: overall fit + most critical gap),
  "strengths": string[] (3-5 specific strengths directly tied to JD requirements),
  "gaps": string[] (2-4 specific gaps the candidate must address),
  "suggestions": string[] (3-6 concrete, actionable improvement suggestions),
  "extractedKeywords": string[] (10-14 key terms and skills extracted from the JD)
}

Here is a reference example of the expected quality and format:
${FEW_SHOT_EXAMPLE}`;

  const userPrompt = `RESUME:
${resumeText.slice(0, 4000)}

JOB DESCRIPTION:
${jdText.slice(0, 3000)}

Analyze now. Return only the JSON object.`;

  const result = await retryGroq(
    () =>
      groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.25,
        max_tokens: 1200,
      }),
    "resume"
  );

  const durationMs = timer();

  if (!result) {
    log.warn("[resume] All retries exhausted, using fallback", { durationMs });
    return keywordFallback(resumeText, jdText);
  }

  try {
    const raw = result.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(extractJson(raw)) as ResumeAnalyzeResponse;

    if (
      typeof parsed.score !== "number" ||
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.gaps) ||
      !Array.isArray(parsed.suggestions)
    ) {
      throw new Error("Schema mismatch in Groq resume response");
    }

    log.info("[resume] Groq analysis succeeded", { durationMs, score: parsed.score, model: GROQ_MODEL });

    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      summary: parsed.summary ?? "",
      strengths: parsed.strengths.slice(0, 5),
      gaps: parsed.gaps.slice(0, 4),
      suggestions: parsed.suggestions.slice(0, 6),
      extractedKeywords: parsed.extractedKeywords?.slice(0, 14) ?? [],
    };
  } catch (err) {
    log.error("[resume] JSON parse failed, using fallback", { durationMs, error: String(err) });
    return keywordFallback(resumeText, jdText);
  }
}

// ── Retry helper ─────────────────────────────────────────────────────────────

async function retryGroq<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = 2
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      log.warn(`[${label}] Groq attempt ${attempt}/${maxAttempts} failed`, { error: String(err) });
      if (attempt === maxAttempts) return null;
      await delay(600 * attempt);
    }
  }
  return null;
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

// ── JSON extraction ───────────────────────────────────────────────────────────

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text.trim();
}

// ── Keyword fallback (deterministic, no LLM) ─────────────────────────────────

const PRIORITY_KEYWORDS = [
  "llm", "nlp", "machine learning", "python", "typescript", "sql",
  "data pipeline", "aws", "system design", "deep learning",
  "retrieval", "vector", "api", "kubernetes", "docker", "react",
  "node.js", "postgresql", "redis", "tensorflow", "pytorch", "spark",
];

function keywordFallback(resumeText: string, jdText: string): ResumeAnalyzeResponse {
  const normResume = normalize(resumeText);
  const normJd = normalize(jdText);

  const jdTokens = extractTokens(normJd);
  const resumeTokenSet = new Set(extractTokens(normResume));

  const matched = jdTokens.filter((t) => resumeTokenSet.has(t));
  const ratio = jdTokens.length > 0 ? matched.length / jdTokens.length : 0;
  const boost = PRIORITY_KEYWORDS.filter(
    (kw) => normResume.includes(kw) && normJd.includes(kw)
  ).length;

  const score = Math.max(0, Math.min(100, Math.round(ratio * 75 + Math.min(boost * 3, 25))));
  const missing = PRIORITY_KEYWORDS.filter(
    (kw) => normJd.includes(kw) && !normResume.includes(kw)
  ).slice(0, 5);

  return {
    score,
    summary:
      score >= 75
        ? "Strong keyword match detected. Focus on quantifying impact and matching JD language precisely."
        : "Moderate keyword match. Address the missing priority skills and sharpen your impact statements.",
    strengths: matched.slice(0, 5).map((t) => `Your resume includes "${t}" which appears in the JD.`),
    gaps: missing.map((kw) => `The JD requires "${kw}" but it is not clearly present in your resume.`),
    suggestions: [
      "Quantify your impact with metrics (e.g. increased throughput by 40%, reduced latency by 200ms).",
      "Mirror exact language from the JD job description in your bullet points where accurate.",
      "Move your most relevant project experience to the top third of your resume.",
      ...missing.map((kw) => `Add a concrete bullet point demonstrating your ${kw} experience.`),
    ].slice(0, 6),
    extractedKeywords: Array.from(new Set(jdTokens)).slice(0, 14),
  };
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function extractTokens(text: string): string[] {
  return text
    .split(/[^a-z0-9+.#/-]+/)
    .filter((t) => t.length > 3)
    .slice(0, 500);
}

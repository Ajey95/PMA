import Groq from "groq-sdk";
import { GenerateAnswerRequest, GenerateAnswerResponse, UserProfile } from "@/lib/types";
import { log, startTimer } from "@/lib/logger";

const GROQ_MODEL = "llama-3.3-70b-versatile";

// ── Few-shot examples ────────────────────────────────────────────────────────

const FEW_SHOT_EXAMPLES = `
EXAMPLE 1
Question: Why do you want to work at this company?
Answer: I am drawn to the mission of making AI accessible rather than simply powerful. What excites me most is the team's track record of shipping research into production systems that millions of users rely on daily. My background building LLM-powered applications means I can contribute from day one while learning from engineers who have solved problems at a scale I have not yet encountered.

EXAMPLE 2
Question: Describe a time you had a significant impact.
Answer: At my previous role, I redesigned the resume-parsing pipeline from a rule-based system to a transformer-based approach, cutting processing time by 60 percent and improving extraction accuracy from 71 to 94 percent. The direct outcome was a 22 percent reduction in user drop-off during the onboarding step that relied on that data. I owned the full cycle from proposal to production rollout and led a cross-functional review with product and data science stakeholders.
`.trim();

// ── Groq-powered answer generation ──────────────────────────────────────────

export async function generateTailoredAnswer(
  input: GenerateAnswerRequest,
  profile: UserProfile | null
): Promise<GenerateAnswerResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  const timer = startTimer();

  if (!apiKey) {
    log.warn("[answer] GROQ_API_KEY not set — using template fallback");
    return templateFallback(input, profile);
  }

  const groq = new Groq({ apiKey });
  const tone = input.tone ?? "professional";
  const maxLength = Math.max(220, Math.min(input.maxLength ?? 900, 1200));

  const profileContext = profile
    ? [
        `Candidate name: ${profile.fullName}.`,
        `Core skills: ${profile.skillsInclude.slice(0, 6).join(", ")}.`,
        `Target roles: ${profile.rolePreferences.slice(0, 3).join(", ")}.`,
        `Role levels: ${profile.roleLevels.slice(0, 2).join(", ") || "not specified"}.`,
        `Industry preferences: ${profile.industryInclude.slice(0, 3).join(", ") || "open"}.`,
      ].join(" ")
    : "No candidate profile provided — write a strong, specific general answer.";

  const systemPrompt = `You are a senior career coach who writes outstanding job application answers.
Your answers are specific, confident, and story-driven — not generic.
Tone: ${tone}. Maximum length: ${maxLength} characters.

Here are examples of high-quality answers for reference:
${FEW_SHOT_EXAMPLES}

Return ONLY valid JSON with this exact schema (no markdown fencing):
{
  "answer": string,
  "alternatives": [string, string],
  "rationale": string
}`;

  const userPrompt = `CANDIDATE PROFILE:
${profileContext}

JOB DESCRIPTION (excerpt):
${input.jdText.slice(0, 2500)}

APPLICATION QUESTION:
"${input.question}"

Write a compelling, highly specific answer. Reference details from the JD where accurate.`;

  const result = await retryGroq(
    () =>
      groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 800,
      }),
    "answer"
  );

  const durationMs = timer();

  if (!result) {
    log.warn("[answer] All retries exhausted, using fallback", { durationMs });
    return templateFallback(input, profile);
  }

  try {
    const raw = result.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(extractJson(raw)) as GenerateAnswerResponse;

    if (typeof parsed.answer !== "string" || !parsed.answer) {
      throw new Error("Missing answer field");
    }

    log.info("[answer] Groq generation succeeded", { durationMs, model: GROQ_MODEL });

    return {
      answer: parsed.answer.slice(0, maxLength),
      alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives.slice(0, 2) : [],
      rationale: parsed.rationale ?? "",
    };
  } catch (err) {
    log.error("[answer] Parse failed after Groq response", { durationMs, error: String(err) });
    return templateFallback(input, profile);
  }
}

// ── Groq retry helper ────────────────────────────────────────────────────────

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

// ── JSON extraction helper ───────────────────────────────────────────────────

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text.trim();
}

// ── Template fallback ─────────────────────────────────────────────────────────

function templateFallback(
  input: GenerateAnswerRequest,
  profile: UserProfile | null
): GenerateAnswerResponse {
  const tone = input.tone ?? "professional";
  const maxLength = Math.max(220, Math.min(input.maxLength ?? 900, 1200));

  const intro = `I am excited about this role because it aligns closely with my experience and the impact I want to create.`;
  const profileLine = profile
    ? `My background spans ${profile.rolePreferences.slice(0, 2).join(" and ")}, with core strengths in ${profile.skillsInclude.slice(0, 4).join(", ")}.`
    : "My background combines strong technical execution with cross-functional collaboration.";
  const jdSignal =
    input.jdText
      .split(/[.!?]/)
      .map((s) => s.trim())
      .find((s) => s.length > 60 && s.length < 180) ??
    "The role emphasizes delivering measurable outcomes and collaborating across teams.";

  let answer = `${intro} ${profileLine} In a ${tone} tone: ${jdSignal} I focus on fast learning, clear communication, and shipping solutions that create real user and business impact.`;
  if (answer.length > maxLength) answer = answer.slice(0, maxLength - 3).trimEnd() + "...";

  return {
    answer,
    alternatives: [
      "I combine hands-on execution with strategic problem solving and clear stakeholder communication.",
      "This role matches my track record of translating complex requirements into reliable, user-centered outcomes.",
    ],
    rationale:
      "The answer aligns candidate strengths with role expectations while remaining fully editable by the user.",
  };
}

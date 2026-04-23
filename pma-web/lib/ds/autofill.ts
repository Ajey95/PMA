/**
 * lib/ds/autofill.ts
 * PRD §4.1 Autofill Agent: "Provides intelligent form-fill payloads for job application fields"
 * PRD §7.3: DS tool to build autofill payload from user profile + job context
 */

import Groq from "groq-sdk";
import { UserProfile, Job } from "@/lib/types";
import { log, startTimer } from "@/lib/logger";

const GROQ_MODEL = "llama-3.3-70b-versatile";

export interface AutofillPayload {
  // Identity
  fullName: string;
  email: string;
  phone: string;
  // Role-specific
  roleSummary: string;        // 2-3 sentence professional summary tailored to this job
  coverNote: string;          // short cover letter opening paragraph
  relevantSkills: string[];   // top skills matching JD
  yearsOfExperience: string;  // inferred from profile level
  // Location
  preferredLocation: string;
  openToRemote: boolean;
  // Salary
  expectedSalaryUsd: string;
}

export async function buildAutofillPayload(
  profile: UserProfile,
  job: Job
): Promise<AutofillPayload> {
  const apiKey = process.env.GROQ_API_KEY;
  const timer = startTimer();

  // Always populate the deterministic fields regardless of AI
  const deterministicFields = {
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    preferredLocation: Object.values(profile.locationPreferences).flat()[0] ?? "Open to discuss",
    openToRemote: Object.values(profile.locationPreferences)
      .flat()
      .some((loc) => loc.toLowerCase().includes("remote")),
    expectedSalaryUsd:
      profile.salaryMinimumUsd > 0
        ? `$${(profile.salaryMinimumUsd / 1000).toFixed(0)}k+`
        : "Open to discuss",
    relevantSkills: profile.skillsInclude
      .filter((skill) =>
        job.requiredSkills
          .map((s) => s.toLowerCase())
          .some((req) => skill.toLowerCase().includes(req) || req.includes(skill.toLowerCase()))
      )
      .concat(
        profile.skillsInclude.filter(
          (skill) =>
            !job.requiredSkills
              .map((s) => s.toLowerCase())
              .some((req) => skill.toLowerCase().includes(req) || req.includes(skill.toLowerCase()))
        )
      )
      .slice(0, 8),
    yearsOfExperience: inferYearsLabel(profile.roleLevels),
  };

  if (!apiKey) {
    log.warn("[autofill] GROQ_API_KEY not set — using template fallback");
    return {
      ...deterministicFields,
      roleSummary: templateSummary(profile, job),
      coverNote: templateCoverNote(profile, job),
    };
  }

  const groq = new Groq({ apiKey });

  const systemPrompt = `You are a professional resume writer. Given a candidate profile and a job description, generate two things:
1. roleSummary: a 2-3 sentence professional summary tailored specifically to this job (first person, confident, specific).
2. coverNote: an opening paragraph for a cover letter (3-4 sentences, specific to the company and role, not generic).

Return ONLY valid JSON (no markdown fencing):
{
  "roleSummary": string,
  "coverNote": string
}`;

  const userPrompt = `CANDIDATE:
Name: ${profile.fullName}
Skills: ${profile.skillsInclude.join(", ")}
Role preferences: ${profile.rolePreferences.join(", ")}
Industry interests: ${profile.industryInclude.join(", ") || "open"}
Experience level: ${profile.roleLevels.join(", ") || "not specified"}

JOB:
Title: ${job.title}
Company: ${job.company}
Required skills: ${job.requiredSkills.join(", ")}
Summary: ${job.summary}
Responsibilities: ${job.responsibilities.slice(0, 3).join("; ")}`;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.55,
      max_tokens: 512,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const jsonStr = extractJson(raw);
    const parsed = JSON.parse(jsonStr) as { roleSummary: string; coverNote: string };
    const durationMs = timer();

    log.info("[autofill] Groq generation succeeded", { durationMs });

    return {
      ...deterministicFields,
      roleSummary: parsed.roleSummary ?? templateSummary(profile, job),
      coverNote: parsed.coverNote ?? templateCoverNote(profile, job),
    };
  } catch (err) {
    const durationMs = timer();
    log.error("[autofill] Groq failed, using template", { durationMs, error: String(err) });
    return {
      ...deterministicFields,
      roleSummary: templateSummary(profile, job),
      coverNote: templateCoverNote(profile, job),
    };
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inferYearsLabel(roleLevels: string[]): string {
  if (!roleLevels.length) return "Not specified";
  if (roleLevels.some((l) => l.toLowerCase().includes("intern"))) return "0-1 years";
  if (roleLevels.some((l) => l.toLowerCase().includes("entry"))) return "0-2 years";
  if (roleLevels.some((l) => l.toLowerCase().includes("junior"))) return "1-3 years";
  if (roleLevels.some((l) => l.toLowerCase().includes("mid"))) return "3-5 years";
  if (roleLevels.some((l) => l.toLowerCase().includes("senior"))) return "5-8 years";
  if (roleLevels.some((l) => l.toLowerCase().includes("expert") || l.toLowerCase().includes("leadership")))
    return "9+ years";
  return "Not specified";
}

function templateSummary(profile: UserProfile, job: Job): string {
  const skills = profile.skillsInclude.slice(0, 4).join(", ");
  const roles = profile.rolePreferences.slice(0, 2).join(" and ");
  return `${profile.fullName || "I"} bring expertise in ${roles || "software engineering"} with core skills in ${skills}. I am applying for the ${job.title} role at ${job.company} because it closely aligns with my professional goals and technical background. I am committed to delivering high-quality, impactful work in a collaborative environment.`;
}

function templateCoverNote(profile: UserProfile, job: Job): string {
  return `I am writing to express my strong interest in the ${job.title} position at ${job.company}. With a background in ${profile.rolePreferences.slice(0, 2).join(" and ")}, I am excited by the opportunity to contribute to your team. My experience with ${profile.skillsInclude.slice(0, 3).join(", ")} positions me well to make an immediate impact. I look forward to discussing how my skills and passion align with ${job.company}'s mission.`;
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text.trim();
}

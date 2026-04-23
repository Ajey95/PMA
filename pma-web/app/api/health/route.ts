import { NextResponse } from "next/server";

const STARTED_AT = Date.now();

export async function GET() {
  const uptimeMs = Date.now() - STARTED_AT;
  const groqConfigured = Boolean(process.env.GROQ_API_KEY);

  return NextResponse.json({
    status: "ok",
    service: "pma-web",
    version: "1.0.0",
    uptime_ms: uptimeMs,
    ai: {
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      configured: groqConfigured,
    },
    endpoints: {
      users: "/api/users",
      jobs: "/api/jobs/search",
      applications: "/api/applications",
      resume: "/api/resume/analyze",
      answer: "/api/generate/answer",
      autofill: "/api/autofill",
    },
    timestamp: new Date().toISOString(),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { buildAutofillPayload } from "@/lib/ds/autofill";
import { getUserProfile, getJob } from "@/lib/store";
import { isNonEmptyString, parseObject } from "@/lib/validation";
import { log, startTimer } from "@/lib/logger";

/**
 * POST /api/autofill
 * PRD §4.1: "Provides intelligent form-fill payloads for job application fields"
 * Body: { userId: string, jobId: string }
 * Response: { data: AutofillPayload, requestId: string }
 */
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const timer = startTimer();

  try {
    const parsed = parseObject(await req.json());
    if (!parsed.ok) {
      return badRequest(parsed.message, requestId);
    }

    const userId = parsed.data.userId;
    const jobId = parsed.data.jobId;

    if (!isNonEmptyString(userId) || !isNonEmptyString(jobId)) {
      return badRequest("userId and jobId are required", requestId);
    }

    const profile = getUserProfile(userId as string);
    if (!profile) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `User profile not found for userId: ${userId}`, requestId } },
        { status: 404 }
      );
    }

    const job = getJob(jobId as string);
    if (!job) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `Job not found for jobId: ${jobId}`, requestId } },
        { status: 404 }
      );
    }

    log.info("[autofill] Building payload", { requestId, userId, jobId });

    const payload = await buildAutofillPayload(profile, job);
    const durationMs = timer();

    log.info("[autofill] Complete", { requestId, durationMs });

    return NextResponse.json({ data: payload, requestId });
  } catch (err) {
    const durationMs = timer();
    log.error("[autofill] Unhandled error", { requestId, durationMs, error: String(err) });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Autofill generation failed", requestId } },
      { status: 500 }
    );
  }
}

function badRequest(message: string, requestId: string) {
  return NextResponse.json({ error: { code: "BAD_REQUEST", message, requestId } }, { status: 400 });
}

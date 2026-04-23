import { NextRequest, NextResponse } from "next/server";
import { updateApplicationStatus } from "@/lib/store";
import { ApplicationStatus } from "@/lib/types";
import { isNonEmptyString, parseObject } from "@/lib/validation";
import { log, startTimer } from "@/lib/logger";

const ALLOWED_STATUSES: ApplicationStatus[] = [
  "NOT_SUBMITTED",
  "SUBMITTED",
  "RECEIVED_INITIAL_RESPONSE",
  "INTERVIEW_REQUESTED",
  "ONSITE_VIDEO_INTERVIEW_REQUESTED",
  "REJECTED_AFTER_INTERVIEW",
];

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const requestId = crypto.randomUUID();
  const timer = startTimer();
  const { applicationId } = await params;

  try {
    const parsed = parseObject(await req.json());
    if (!parsed.ok) {
      return badRequest(parsed.message, requestId);
    }

    const status = parsed.data.status;
    if (!isNonEmptyString(status)) {
      return badRequest("status is required", requestId);
    }
    if (!ALLOWED_STATUSES.includes(status as ApplicationStatus)) {
      return badRequest(
        `status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
        requestId
      );
    }

    const updated = updateApplicationStatus(applicationId, status as ApplicationStatus);
    if (!updated) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `Application ${applicationId} not found`, requestId } },
        { status: 404 }
      );
    }

    const durationMs = timer();
    log.info("[applications/status] Updated", {
      requestId,
      applicationId,
      status,
      durationMs,
    });

    return NextResponse.json({ data: updated, requestId });
  } catch (err) {
    const durationMs = timer();
    log.error("[applications/status] Failed", { requestId, durationMs, error: String(err) });
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Invalid JSON payload", requestId } },
      { status: 400 }
    );
  }
}

function badRequest(message: string, requestId: string) {
  return NextResponse.json({ error: { code: "BAD_REQUEST", message, requestId } }, { status: 400 });
}

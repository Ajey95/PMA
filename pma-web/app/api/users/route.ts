import { NextRequest, NextResponse } from "next/server";
import { createUserProfile } from "@/lib/store";
import { isStringArray, isNonEmptyString, parseObject, requireFields } from "@/lib/validation";
import { log, startTimer } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const timer = startTimer();

  try {
    const body = await req.json();
    const parsed = parseObject(body);
    if (!parsed.ok) {
      return badRequest(parsed.message, requestId);
    }

    const required = requireFields(parsed.data, ["fullName", "email", "phone"]);
    if (!required.ok) {
      return badRequest(required.message, requestId);
    }

    const { fullName, email, phone } = parsed.data;

    if (!isNonEmptyString(fullName) || !isNonEmptyString(email) || !isNonEmptyString(phone)) {
      return badRequest("fullName, email, and phone must be non-empty strings", requestId);
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email as string)) {
      return badRequest("email must be a valid email address", requestId);
    }

    const profile = createUserProfile({
      fullName: fullName as string,
      email: (email as string).trim().toLowerCase(),
      phone: (phone as string).trim(),
      locationPreferences: (parsed.data.locationPreferences as Record<string, string[]>) ?? {},
      workHistory: (parsed.data.workHistory as never[]) ?? [],
      education: (parsed.data.education as never[]) ?? [],
      skillsInclude: isStringArray(parsed.data.skillsInclude) ? parsed.data.skillsInclude : [],
      skillsExclude: isStringArray(parsed.data.skillsExclude) ? parsed.data.skillsExclude : [],
      rolePreferences: isStringArray(parsed.data.rolePreferences) ? parsed.data.rolePreferences : [],
      roleLevels: isStringArray(parsed.data.roleLevels) ? parsed.data.roleLevels : [],
      companySizePreferences: isStringArray(parsed.data.companySizePreferences)
        ? parsed.data.companySizePreferences
        : [],
      industryInclude: isStringArray(parsed.data.industryInclude) ? parsed.data.industryInclude : [],
      industryExclude: isStringArray(parsed.data.industryExclude) ? parsed.data.industryExclude : [],
      salaryMinimumUsd:
        typeof parsed.data.salaryMinimumUsd === "number" ? parsed.data.salaryMinimumUsd : 0,
      jobSearchStatus:
        parsed.data.jobSearchStatus === "CLOSED_TO_OFFERS" ||
        parsed.data.jobSearchStatus === "OPEN_TO_OFFERS"
          ? parsed.data.jobSearchStatus
          : "ACTIVELY_LOOKING",
    });

    const durationMs = timer();
    log.info("[users POST] Profile created", { requestId, userId: profile.userId, durationMs });

    return NextResponse.json({ data: profile, requestId }, { status: 201 });
  } catch (err) {
    const durationMs = timer();
    log.error("[users POST] Failed", { requestId, durationMs, error: String(err) });
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Invalid JSON payload", requestId } },
      { status: 400 }
    );
  }
}

function badRequest(message: string, requestId: string) {
  return NextResponse.json({ error: { code: "BAD_REQUEST", message, requestId } }, { status: 400 });
}

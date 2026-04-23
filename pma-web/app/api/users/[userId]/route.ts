import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, upsertUserProfile } from "@/lib/store";
import { isStringArray, isNonEmptyString, parseObject } from "@/lib/validation";
import { log, startTimer } from "@/lib/logger";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const requestId = crypto.randomUUID();
  const { userId } = await params;

  const profile = getUserProfile(userId);
  if (!profile) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: `User profile not found: ${userId}`, requestId } },
      { status: 404 }
    );
  }

  log.info("[users GET] Profile fetched", { requestId, userId });
  return NextResponse.json({ data: profile, requestId });
}

/**
 * PUT /api/users/{userId}
 * Full profile upsert — allows updating any profile fields.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const requestId = crypto.randomUUID();
  const timer = startTimer();
  const { userId } = await params;

  try {
    const existing = getUserProfile(userId);
    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `User profile not found: ${userId}`, requestId } },
        { status: 404 }
      );
    }

    const parsed = parseObject(await req.json());
    if (!parsed.ok) {
      return badRequest(parsed.message, requestId);
    }

    const d = parsed.data;

    // Merge provided fields over existing profile
    const updated = upsertUserProfile({
      ...existing,
      ...(isNonEmptyString(d.fullName) ? { fullName: d.fullName as string } : {}),
      ...(isNonEmptyString(d.email) ? { email: (d.email as string).trim().toLowerCase() } : {}),
      ...(isNonEmptyString(d.phone) ? { phone: (d.phone as string).trim() } : {}),
      ...(typeof d.locationPreferences === "object" && d.locationPreferences !== null
        ? { locationPreferences: d.locationPreferences as Record<string, string[]> }
        : {}),
      ...(isStringArray(d.skillsInclude) ? { skillsInclude: d.skillsInclude } : {}),
      ...(isStringArray(d.skillsExclude) ? { skillsExclude: d.skillsExclude } : {}),
      ...(isStringArray(d.rolePreferences) ? { rolePreferences: d.rolePreferences } : {}),
      ...(isStringArray(d.roleLevels) ? { roleLevels: d.roleLevels } : {}),
      ...(isStringArray(d.companySizePreferences)
        ? { companySizePreferences: d.companySizePreferences }
        : {}),
      ...(isStringArray(d.industryInclude) ? { industryInclude: d.industryInclude } : {}),
      ...(isStringArray(d.industryExclude) ? { industryExclude: d.industryExclude } : {}),
      ...(typeof d.salaryMinimumUsd === "number" ? { salaryMinimumUsd: d.salaryMinimumUsd } : {}),
      ...(d.jobSearchStatus === "CLOSED_TO_OFFERS" ||
      d.jobSearchStatus === "OPEN_TO_OFFERS" ||
      d.jobSearchStatus === "ACTIVELY_LOOKING"
        ? { jobSearchStatus: d.jobSearchStatus }
        : {}),
    });

    const durationMs = timer();
    log.info("[users PUT] Profile updated", { requestId, userId, durationMs });

    return NextResponse.json({ data: updated, requestId });
  } catch (err) {
    const durationMs = timer();
    log.error("[users PUT] Failed", { requestId, durationMs, error: String(err) });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update profile", requestId } },
      { status: 500 }
    );
  }
}

function badRequest(message: string, requestId: string) {
  return NextResponse.json({ error: { code: "BAD_REQUEST", message, requestId } }, { status: 400 });
}

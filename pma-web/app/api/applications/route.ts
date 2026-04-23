import { NextRequest, NextResponse } from "next/server";
import { createApplication, listApplications } from "@/lib/store";
import { isNonEmptyString, parseObject } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const userId = req.nextUrl.searchParams.get("userId") ?? undefined;
  const data = listApplications(userId);
  return NextResponse.json({ data, requestId });
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
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

    const data = createApplication(userId, jobId);
    return NextResponse.json({ data, requestId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Invalid JSON payload", requestId } },
      { status: 400 }
    );
  }
}

function badRequest(message: string, requestId: string) {
  return NextResponse.json({ error: { code: "BAD_REQUEST", message, requestId } }, { status: 400 });
}

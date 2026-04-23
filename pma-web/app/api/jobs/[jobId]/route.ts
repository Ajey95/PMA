import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const requestId = crypto.randomUUID();
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Job not found", requestId } },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: job, requestId });
}

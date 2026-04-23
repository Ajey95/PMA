import { NextRequest, NextResponse } from "next/server";
import { generateTailoredAnswer } from "@/lib/ds/answer";
import { getUserProfile } from "@/lib/store";
import { isNonEmptyString, parseObject } from "@/lib/validation";
import { log, startTimer } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const timer = startTimer();

  try {
    const parsed = parseObject(await req.json());
    if (!parsed.ok) {
      log.warn("[generate/answer] Bad request", { requestId, message: parsed.message });
      return badRequest(parsed.message, requestId);
    }

    const userId = parsed.data.userId;
    const jdText = parsed.data.jdText;
    const question = parsed.data.question;

    if (!isNonEmptyString(userId) || !isNonEmptyString(jdText) || !isNonEmptyString(question)) {
      return badRequest("userId, jdText, and question are required non-empty strings", requestId);
    }

    if (question.length < 10) {
      return badRequest("question is too short", requestId);
    }

    const profile = getUserProfile(userId);

    log.info("[generate/answer] Generating", {
      requestId,
      userId,
      questionLength: (question as string).length,
      hasProfile: Boolean(profile),
    });

    const output = await generateTailoredAnswer(
      {
        userId: userId as string,
        jdText: jdText as string,
        question: question as string,
        tone: isNonEmptyString(parsed.data.tone) ? (parsed.data.tone as string) : undefined,
        maxLength: typeof parsed.data.maxLength === "number" ? parsed.data.maxLength : undefined,
      },
      profile
    );

    const durationMs = timer();
    log.info("[generate/answer] Complete", { requestId, durationMs, answerLength: output.answer.length });

    return NextResponse.json({ data: output, requestId });
  } catch (err) {
    const durationMs = timer();
    log.error("[generate/answer] Unhandled error", { requestId, durationMs, error: String(err) });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Answer generation failed", requestId } },
      { status: 500 }
    );
  }
}

function badRequest(message: string, requestId: string) {
  return NextResponse.json({ error: { code: "BAD_REQUEST", message, requestId } }, { status: 400 });
}

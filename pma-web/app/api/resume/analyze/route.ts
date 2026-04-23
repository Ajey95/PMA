import { NextRequest, NextResponse } from "next/server";
import { analyzeResumeAgainstJd } from "@/lib/ds/resume";
import { scrapeJobDescription } from "@/lib/ds/scraper";
import { isNonEmptyString, parseObject } from "@/lib/validation";
import { log, startTimer } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const timer = startTimer();

  try {
    const parsed = parseObject(await req.json());
    if (!parsed.ok) {
      log.warn("[resume/analyze] Bad request", { requestId, message: parsed.message });
      return badRequest(parsed.message, requestId);
    }

    const resumeText = parsed.data.resumeText;
    const jdTextInput = parsed.data.jdText;
    const jdUrl = parsed.data.jdUrl;

    if (!isNonEmptyString(resumeText)) {
      return badRequest("resumeText is required and must be a non-empty string", requestId);
    }
    if (resumeText.length < 50) {
      return badRequest("resumeText is too short — please provide more detail", requestId);
    }

    let jdText = isNonEmptyString(jdTextInput) ? jdTextInput : "";

    if (!jdText && isNonEmptyString(jdUrl)) {
      log.info("[resume/analyze] Scraping JD from URL", { requestId, url: jdUrl });
      const scraped = await scrapeJobDescription(jdUrl);
      jdText = scraped.text;
    }

    if (!jdText) {
      return badRequest("Either jdText or jdUrl is required", requestId);
    }

    log.info("[resume/analyze] Starting analysis", { requestId, resumeLength: resumeText.length, jdLength: jdText.length });

    const result = await analyzeResumeAgainstJd(resumeText, jdText);
    const durationMs = timer();

    log.info("[resume/analyze] Complete", { requestId, score: result.score, durationMs });

    return NextResponse.json({ data: result, requestId });
  } catch (err) {
    const durationMs = timer();
    log.error("[resume/analyze] Unhandled error", { requestId, durationMs, error: String(err) });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Analysis failed unexpectedly", requestId } },
      { status: 500 }
    );
  }
}

function badRequest(message: string, requestId: string) {
  return NextResponse.json({ error: { code: "BAD_REQUEST", message, requestId } }, { status: 400 });
}

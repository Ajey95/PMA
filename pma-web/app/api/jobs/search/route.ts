import { NextRequest, NextResponse } from "next/server";
import { listJobs } from "@/lib/store";
import { log, startTimer } from "@/lib/logger";

/**
 * GET /api/jobs/search
 * Query params:
 *   q        — full text (title/company/category/skills)
 *   skills   — comma-separated required skills filter
 *   level    — comma-separated levels (Mid, Senior, etc.)
 *   location — location substring filter
 *   minSalary— minimum numeric salary (USD)
 */
export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const timer = startTimer();

  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") ?? "").toLowerCase().trim();
  const skillsParam = searchParams.get("skills") ?? "";
  const levelParam = searchParams.get("level") ?? "";
  const locationParam = (searchParams.get("location") ?? "").toLowerCase().trim();
  const minSalaryParam = searchParams.get("minSalary");

  const requiredSkills = skillsParam
    ? skillsParam.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];
  const requiredLevels = levelParam
    ? levelParam.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];
  const minSalary = minSalaryParam ? parseInt(minSalaryParam, 10) : 0;

  const all = listJobs();

  const data = all.filter((job) => {
    // Full-text filter
    if (q) {
      const haystack = [
        job.title,
        job.company,
        job.categories.join(" "),
        job.requiredSkills.join(" "),
        job.summary,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    // Skills filter — job must include at least one required skill
    if (requiredSkills.length > 0) {
      const jobSkills = job.requiredSkills.map((s) => s.toLowerCase());
      const hasSkill = requiredSkills.some((rs) =>
        jobSkills.some((js) => js.includes(rs) || rs.includes(js))
      );
      if (!hasSkill) return false;
    }

    // Level filter
    if (requiredLevels.length > 0) {
      const jobLevels = job.level.map((l) => l.toLowerCase());
      if (!requiredLevels.some((rl) => jobLevels.some((jl) => jl.includes(rl)))) return false;
    }

    // Location filter
    if (locationParam) {
      const allLocs = job.locations.map((l) => l.toLowerCase()).join(" ");
      if (!allLocs.includes(locationParam)) return false;
    }

    // Salary filter
    if (minSalary > 0 && job.salary) {
      const nums = job.salary.match(/\d[\d,]*/g);
      if (nums && nums.length > 0) {
        const firstNum = parseInt(nums[0].replace(/,/g, ""), 10);
        if (firstNum < minSalary) return false;
      }
    }

    return true;
  });

  const durationMs = timer();
  log.info("[jobs/search] Completed", { requestId, q, resultCount: data.length, durationMs });

  return NextResponse.json({ data, requestId, meta: { total: data.length } });
}

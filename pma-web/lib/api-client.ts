import { Application, GenerateAnswerResponse, Job, ResumeAnalyzeResponse, UserProfile } from "@/lib/types";

async function parseJson<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error?.message ?? "Request failed");
  }
  return body.data as T;
}

export async function createUser(profile: Omit<UserProfile, "userId">): Promise<UserProfile> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  return parseJson<UserProfile>(res);
}

export async function getUser(userId: string): Promise<UserProfile> {
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}`);
  return parseJson<UserProfile>(res);
}

export async function updateUser(
  userId: string,
  profile: Partial<Omit<UserProfile, "userId">>
): Promise<UserProfile> {
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  return parseJson<UserProfile>(res);
}

export async function searchJobs(
  query = "",
  filters?: { skills?: string[]; level?: string; location?: string; minSalary?: number }
): Promise<Job[]> {
  const params = new URLSearchParams({ q: query });
  if (filters?.skills?.length) params.set("skills", filters.skills.join(","));
  if (filters?.level) params.set("level", filters.level);
  if (filters?.location) params.set("location", filters.location);
  if (filters?.minSalary) params.set("minSalary", String(filters.minSalary));
  const res = await fetch(`/api/jobs/search?${params.toString()}`);
  return parseJson<Job[]>(res);
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`);
  return parseJson<Job>(res);
}

export async function analyzeResume(payload: {
  resumeText: string;
  jdText?: string;
  jdUrl?: string;
  userId?: string;
}): Promise<ResumeAnalyzeResponse> {
  const res = await fetch("/api/resume/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<ResumeAnalyzeResponse>(res);
}

export async function generateAnswer(payload: {
  userId: string;
  jdText: string;
  question: string;
  tone?: string;
  maxLength?: number;
}): Promise<GenerateAnswerResponse> {
  const res = await fetch("/api/generate/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<GenerateAnswerResponse>(res);
}

export async function listApplications(userId: string): Promise<Application[]> {
  const res = await fetch(`/api/applications?userId=${encodeURIComponent(userId)}`);
  return parseJson<Application[]>(res);
}

export async function createApplication(userId: string, jobId: string): Promise<Application> {
  const res = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, jobId }),
  });
  return parseJson<Application>(res);
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string
): Promise<Application> {
  const res = await fetch(`/api/applications/${applicationId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return parseJson<Application>(res);
}

export async function getAutofill(userId: string, jobId: string): Promise<Record<string, unknown>> {
  const res = await fetch("/api/autofill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, jobId }),
  });
  return parseJson<Record<string, unknown>>(res);
}


import { mockJobs } from "@/lib/mock-data";
import { Application, ApplicationStatus, Job, UserProfile } from "@/lib/types";

const users = new Map<string, UserProfile>();
const jobs = new Map<string, Job>(mockJobs.map((job) => [job.jobId, job]));
const applications = new Map<string, Application>();

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createUserProfile(payload: Omit<UserProfile, "userId">): UserProfile {
  const userId = makeId("usr");
  const profile: UserProfile = { userId, ...payload };
  users.set(userId, profile);
  return profile;
}

export function getUserProfile(userId: string): UserProfile | null {
  return users.get(userId) ?? null;
}

export function upsertUserProfile(profile: UserProfile): UserProfile {
  users.set(profile.userId, profile);
  return profile;
}

export function listJobs(): Job[] {
  return Array.from(jobs.values());
}

export function getJob(jobId: string): Job | null {
  return jobs.get(jobId) ?? null;
}

export function createApplication(userId: string, jobId: string): Application {
  const applicationId = makeId("app");
  const now = new Date().toISOString();
  const application: Application = {
    applicationId,
    userId,
    jobId,
    status: "NOT_SUBMITTED",
    createdAt: now,
    updatedAt: now,
  };
  applications.set(applicationId, application);
  return application;
}

export function updateApplicationStatus(applicationId: string, status: ApplicationStatus): Application | null {
  const existing = applications.get(applicationId);
  if (!existing) {
    return null;
  }
  const updated: Application = { ...existing, status, updatedAt: new Date().toISOString() };
  applications.set(applicationId, updated);
  return updated;
}

export function listApplications(userId?: string): Application[] {
  const items = Array.from(applications.values());
  if (!userId) {
    return items;
  }
  return items.filter((item) => item.userId === userId);
}

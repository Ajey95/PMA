export type JobSearchStatus =
  | "ACTIVELY_LOOKING"
  | "OPEN_TO_OFFERS"
  | "CLOSED_TO_OFFERS";

export type ApplicationStatus =
  | "NOT_SUBMITTED"
  | "SUBMITTED"
  | "RECEIVED_INITIAL_RESPONSE"
  | "INTERVIEW_REQUESTED"
  | "ONSITE_VIDEO_INTERVIEW_REQUESTED"
  | "REJECTED_AFTER_INTERVIEW";

export type WorkItem = {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  achievements: string[];
};

export type EducationItem = {
  institution: string;
  degree: string;
  field: string;
  graduationYear?: number;
};

export type UserProfile = {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  locationPreferences: Record<string, string[]>;
  workHistory: WorkItem[];
  education: EducationItem[];
  skillsInclude: string[];
  skillsExclude: string[];
  rolePreferences: string[];
  roleLevels: string[];
  companySizePreferences: string[];
  industryInclude: string[];
  industryExclude: string[];
  salaryMinimumUsd: number;
  jobSearchStatus: JobSearchStatus;
};

export type ResumeAnalyzeRequest = {
  userId?: string;
  resumeText: string;
  jdUrl?: string;
  jdText?: string;
};

export type ResumeAnalyzeResponse = {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  extractedKeywords: string[];
};

export type GenerateAnswerRequest = {
  userId: string;
  jdText: string;
  question: string;
  tone?: string;
  maxLength?: number;
};

export type GenerateAnswerResponse = {
  answer: string;
  alternatives?: string[];
  rationale?: string;
};

export type Job = {
  jobId: string;
  title: string;
  company: string;
  companySize: string;
  salary?: string;
  level: string[];
  locations: string[];
  categories: string[];
  requiredSkills: string[];
  summary: string;
  requirements: string[];
  responsibilities: string[];
  desiredQualifications: string[];
  fullPosting: string;
};

export type Application = {
  applicationId: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

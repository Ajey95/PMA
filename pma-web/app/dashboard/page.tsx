"use client";

import { useEffect, useState } from "react";
import { createApplication, listApplications, searchJobs, updateApplicationStatus } from "@/lib/api-client";
import { Application, ApplicationStatus, Job } from "@/lib/types";
import { ModernPageHeader } from "@/components/modern-page-header";
import { PageMetrics } from "@/components/page-metrics";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  NOT_SUBMITTED: "Not Submitted",
  SUBMITTED: "Submitted",
  RECEIVED_INITIAL_RESPONSE: "Response Received",
  INTERVIEW_REQUESTED: "Interview Requested",
  ONSITE_VIDEO_INTERVIEW_REQUESTED: "Onsite / Video Interview",
  REJECTED_AFTER_INTERVIEW: "Rejected After Interview",
};

const STATUS_TONE: Record<ApplicationStatus, string> = {
  NOT_SUBMITTED: "status-neutral",
  SUBMITTED: "status-submitted",
  RECEIVED_INITIAL_RESPONSE: "status-positive",
  INTERVIEW_REQUESTED: "status-positive",
  ONSITE_VIDEO_INTERVIEW_REQUESTED: "status-strong",
  REJECTED_AFTER_INTERVIEW: "status-negative",
};

const statusOptions: ApplicationStatus[] = [
  "NOT_SUBMITTED",
  "SUBMITTED",
  "RECEIVED_INITIAL_RESPONSE",
  "INTERVIEW_REQUESTED",
  "ONSITE_VIDEO_INTERVIEW_REQUESTED",
  "REJECTED_AFTER_INTERVIEW",
];

export default function DashboardPage() {
  const [userId, setUserId] = useState("demo-user");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  // Load jobs once
  useEffect(() => {
    searchJobs()
      .then((result) => {
        setJobs(result);
        if (!selectedJobId && result[0]) setSelectedJobId(result[0].jobId);
      })
      .catch(() => setError("Failed to load jobs"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-load applications when userId changes
  useEffect(() => {
    if (!userId.trim()) return;
    listApplications(userId).then(setApplications).catch(() => setError("Failed to load applications"));
  }, [userId]);

  async function addApplication() {
    if (!selectedJobId || adding) return;
    setAdding(true);
    try {
      await createApplication(userId, selectedJobId);
      const data = await listApplications(userId);
      setApplications(data);
    } catch {
      setError("Failed to create application");
    } finally {
      setAdding(false);
    }
  }

  async function updateStatus(appId: string, status: string) {
    await updateApplicationStatus(appId, status);
    const data = await listApplications(userId);
    setApplications(data);
  }

  const activeCount = applications.filter((a) =>
    ["SUBMITTED", "RECEIVED_INITIAL_RESPONSE", "INTERVIEW_REQUESTED", "ONSITE_VIDEO_INTERVIEW_REQUESTED"].includes(a.status)
  ).length;
  const interviews = applications.filter((a) =>
    ["INTERVIEW_REQUESTED", "ONSITE_VIDEO_INTERVIEW_REQUESTED"].includes(a.status)
  ).length;

  return (
    <main className="app-page">
      <ModernPageHeader
        label="Application command center"
        title="Track every application in one premium dashboard"
        subtitle="Status updates, saved roles, and application lifecycle visibility in a single high-clarity workspace."
        actions={[{ href: "/jobs", label: "Browse Jobs" }, { href: "/assistant", label: "Generate Answers", primary: true }]}
      />

      <PageMetrics
        items={[
          { label: "Total applications", value: String(applications.length || 0), tone: "hero-stat" },
          { label: "Active pipeline", value: String(activeCount) },
          { label: "Interviews scheduled", value: String(interviews) },
        ]}
      />

      <section className="panel-white glass-card">
        <div className="dashboard-toolbar">
          <div className="stack">
            <label className="field-label" htmlFor="userId-input">User ID</label>
            <input
              id="userId-input"
              className="field"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter userId (e.g. demo-user)"
            />
          </div>

          <div className="stack">
            <label className="field-label" htmlFor="job-select">Add application for job</label>
            <div className="row-gap">
              <select
                id="job-select"
                className="field"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
              >
                {jobs.map((job) => (
                  <option key={job.jobId} value={job.jobId}>
                    {job.title} — {job.company}
                  </option>
                ))}
              </select>
              <button className="primary" onClick={addApplication} disabled={adding || !selectedJobId}>
                {adding ? "Adding…" : "+ Add"}
              </button>
            </div>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="applications-list">
          {applications.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <p>No applications yet. Select a job above and click <strong>Add</strong> to track one.</p>
            </div>
          ) : (
            applications.map((item) => {
              const jobTitle = jobs.find((j) => j.jobId === item.jobId)?.title ?? item.jobId;
              const company = jobs.find((j) => j.jobId === item.jobId)?.company ?? "";
              return (
                <div key={item.applicationId} className="app-card">
                  <div className="app-card-info">
                    <strong className="app-card-title">{jobTitle}</strong>
                    {company && <span className="app-card-company">{company}</span>}
                    <span className={`status-badge ${STATUS_TONE[item.status]}`}>
                      {STATUS_LABELS[item.status]}
                    </span>
                  </div>
                  <div className="app-card-actions">
                    <select
                      className="field small-field"
                      value={item.status}
                      onChange={(e) => updateStatus(item.applicationId, e.target.value)}
                      aria-label={`Update status for ${jobTitle}`}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                    <a href="/jobs" className="ghost small" aria-label="View job">View Job →</a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}

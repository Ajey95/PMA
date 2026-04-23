"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/api-client";
import { ModernPageHeader } from "@/components/modern-page-header";
import { PageMetrics } from "@/components/page-metrics";

const JOB_SEARCH_STATUSES = [
  { value: "ACTIVELY_LOOKING", label: "Actively looking" },
  { value: "OPEN_TO_OFFERS", label: "Not looking but open to offers" },
  { value: "CLOSED_TO_OFFERS", label: "Not looking and closed to offers" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    rolePreferences: "AI & Machine Learning, Software Engineering",
    skillsInclude: "Python, TypeScript, LLM, SQL",
    salaryMinimumUsd: 80,
    jobSearchStatus: "ACTIVELY_LOOKING",
  });
  const [createdUserId, setCreatedUserId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await createUser({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        locationPreferences: {},
        workHistory: [],
        education: [],
        skillsInclude: splitCSV(form.skillsInclude),
        skillsExclude: [],
        rolePreferences: splitCSV(form.rolePreferences),
        roleLevels: [],
        companySizePreferences: [],
        industryInclude: [],
        industryExclude: [],
        salaryMinimumUsd: form.salaryMinimumUsd * 1000,
        jobSearchStatus:
          form.jobSearchStatus === "CLOSED_TO_OFFERS" || form.jobSearchStatus === "OPEN_TO_OFFERS"
            ? (form.jobSearchStatus as "CLOSED_TO_OFFERS" | "OPEN_TO_OFFERS")
            : "ACTIVELY_LOOKING",
      });
      setCreatedUserId(result.userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-page">
      <ModernPageHeader
        label="Profile intelligence"
        title="Your AI job profile, preferences, and settings"
        subtitle="Keep your core preferences current so autofill, ranking, and answer generation stay aligned."
        actions={[
          { href: "/onboarding", label: "Full Onboarding Wizard", primary: true },
          { href: "/assistant", label: "Open Assistant" },
        ]}
      />

      <PageMetrics
        items={[
          { label: "Profile completeness", value: form.fullName && form.email ? "Ready" : "Incomplete", tone: "hero-stat" },
          { label: "Skills added", value: String(splitCSV(form.skillsInclude).length) },
          { label: "Search status", value: JOB_SEARCH_STATUSES.find((s) => s.value === form.jobSearchStatus)?.label ?? "—" },
        ]}
      />

      <section className="panel-white narrow glass-card">
        <h2>User Profile &amp; Settings</h2>
        <p className="muted">
          This powers Autofill, Resume Scoring, and Tailored Answer agents.{" "}
          <button className="inline-link" onClick={() => router.push("/onboarding")}>
            Use the full onboarding wizard →
          </button>
        </p>

        <form className="stack" onSubmit={handleSubmit} noValidate>
          <div className="grid-two">
            <div className="stack">
              <label className="field-label" htmlFor="fullName">Full Name *</label>
              <input
                id="fullName"
                className="field"
                value={form.fullName}
                onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                required
                autoComplete="name"
              />
            </div>
            <div className="stack">
              <label className="field-label" htmlFor="email">Email *</label>
              <input
                id="email"
                className="field"
                type="email"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <label className="field-label" htmlFor="phone">Phone</label>
          <input
            id="phone"
            className="field"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
            autoComplete="tel"
          />

          <label className="field-label" htmlFor="rolePrefs">Role Preferences (comma separated)</label>
          <input
            id="rolePrefs"
            className="field"
            value={form.rolePreferences}
            onChange={(e) => setForm((s) => ({ ...s, rolePreferences: e.target.value }))}
            placeholder="e.g. AI & Machine Learning, Software Engineering"
          />

          <label className="field-label" htmlFor="skills">Skills Include (comma separated)</label>
          <input
            id="skills"
            className="field"
            value={form.skillsInclude}
            onChange={(e) => setForm((s) => ({ ...s, skillsInclude: e.target.value }))}
            placeholder="e.g. Python, TypeScript, SQL"
          />

          <div className="stack">
            <label className="field-label" htmlFor="salary-slider">
              Minimum Salary: <strong>${form.salaryMinimumUsd}k USD</strong>
            </label>
            <div className="salary-mini-badge">${form.salaryMinimumUsd}k</div>
            <input
              id="salary-slider"
              className="slider"
              type="range"
              min={0}
              max={450}
              step={5}
              value={form.salaryMinimumUsd}
              onChange={(e) => setForm((s) => ({ ...s, salaryMinimumUsd: Number(e.target.value) }))}
              aria-label="Minimum salary"
            />
          </div>

          <label className="field-label" htmlFor="job-status">Job Search Status</label>
          <select
            id="job-status"
            className="field"
            value={form.jobSearchStatus}
            onChange={(e) => setForm((s) => ({ ...s, jobSearchStatus: e.target.value }))}
          >
            {JOB_SEARCH_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <button className="primary" disabled={loading || !form.fullName || !form.email}>
            {loading ? "Saving…" : "Save Profile"}
          </button>
        </form>

        {createdUserId && (
          <div className="success-banner">
            <p>✓ Profile saved! User ID: <code>{createdUserId}</code></p>
            <button className="ghost small" onClick={() => router.push("/onboarding")}>
              Complete full onboarding →
            </button>
          </div>
        )}
        {error && <p className="error-text" role="alert">{error}</p>}
      </section>
    </main>
  );
}

function splitCSV(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

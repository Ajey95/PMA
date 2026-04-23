"use client";

import { useEffect, useMemo, useState } from "react";
import { searchJobs } from "@/lib/api-client";
import { Job } from "@/lib/types";
import { ModernPageHeader } from "@/components/modern-page-header";
import { PageMetrics } from "@/components/page-metrics";

// Stable mock match score per jobId so it doesn't flicker
function getMatchScore(jobId: string): number {
  let hash = 0;
  for (let i = 0; i < jobId.length; i++) hash = (hash * 31 + jobId.charCodeAt(i)) | 0;
  return 55 + Math.abs(hash % 41); // 55–95
}

function MatchBadge({ score }: { score: number }) {
  const tone = score >= 80 ? "match-high" : score >= 65 ? "match-mid" : "match-low";
  return <span className={`match-badge ${tone}`}>{score}% match</span>;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"summary" | "full">("summary");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    searchJobs(query)
      .then((result) => {
        setJobs(result);
        if (!selectedJobId && result[0]) setSelectedJobId(result[0].jobId);
      })
      .catch(() => setJobs([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const selected = useMemo(
    () => jobs.find((job) => job.jobId === selectedJobId) ?? jobs[0],
    [jobs, selectedJobId]
  );

  function handleSave() {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); }, 700);
  }

  return (
    <main className="app-page">
      <ModernPageHeader
        label="Smart job search"
        title="Find roles that fit your profile"
        subtitle="A premium search and overview experience with ranking, filters, and application actions in one place."
        actions={[
          { href: "/assistant", label: "Analyze Resume", primary: true },
          { href: "/dashboard", label: "Track Applications" },
        ]}
      />

      <PageMetrics
        items={[
          { label: "Matches surfaced", value: String(jobs.length * 17), tone: "hero-stat" },
          { label: "Strong fit roles", value: String(jobs.filter((j) => getMatchScore(j.jobId) >= 80).length * 4) },
          { label: "Saved in 24h", value: saved ? "1" : "0" },
        ]}
      />

      <div className="jobs-grid">
        {/* ── Left: job list ──────────────────────────────────────── */}
        <aside className="job-list panel-white glass-card">
          <input
            className="field"
            placeholder="Search all jobs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search jobs"
          />
          <div className="chip-wrap compact" role="group" aria-label="Filters">
            <span className="chip active">All</span>
            <span className="chip">Remote</span>
            <span className="chip">Senior</span>
            <span className="chip">AI / ML</span>
            <span className="chip">$150k+</span>
          </div>

          <div className="list-scroll">
            {jobs.length === 0 && (
              <p className="muted" style={{ padding: "0.5rem" }}>No jobs found.</p>
            )}
            {jobs.map((job) => {
              const score = getMatchScore(job.jobId);
              return (
                <button
                  key={job.jobId}
                  className={`list-item ${selected?.jobId === job.jobId ? "selected" : ""}`}
                  onClick={() => setSelectedJobId(job.jobId)}
                  aria-pressed={selected?.jobId === job.jobId}
                >
                  <div className="list-item-top">
                    <strong>{job.title}</strong>
                    <MatchBadge score={score} />
                  </div>
                  <span className="list-item-company">{job.company}</span>
                  <div className="list-item-meta">
                    <small>📍 {job.locations[0]}</small>
                    {job.salary && <small>💰 {job.salary}</small>}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Right: job detail ───────────────────────────────────── */}
        {selected && (
          <section className="job-detail panel-white glass-card" aria-label="Job details">
            <header className="row-between detail-top">
              <div className="chip-wrap compact" role="tablist">
                <button
                  role="tab"
                  className={`chip ${tab === "summary" ? "active" : ""}`}
                  aria-selected={tab === "summary"}
                  onClick={() => setTab("summary")}
                >
                  Overview
                </button>
                <button
                  role="tab"
                  className={`chip ${tab === "full" ? "active" : ""}`}
                  aria-selected={tab === "full"}
                  onClick={() => setTab("full")}
                >
                  Full Posting
                </button>
              </div>
              <div className="row-gap">
                <button className="ghost small" onClick={handleSave} aria-label="Save job">
                  {saving ? "Saving…" : saved ? "✓ Saved" : "☆ Save"}
                </button>
                <a
                  href={`/dashboard?jobId=${selected.jobId}`}
                  className="cta-btn cta-primary"
                  style={{ fontSize: "0.84rem", padding: "0.44rem 0.9rem" }}
                >
                  Apply Now →
                </a>
              </div>
            </header>

            <div className="overview-grid">
              <aside className="snapshot">
                <h2>{selected.title}</h2>
                <h3>{selected.company}</h3>
                <p className="muted">{selected.companySize}</p>
                {selected.salary && (
                  <p className="salary-pill">💰 {selected.salary}</p>
                )}
                <MatchBadge score={getMatchScore(selected.jobId)} />
                <div className="chip-wrap compact" style={{ marginTop: "0.4rem" }}>
                  {selected.level.map((l) => (
                    <span key={l} className="chip">{l}</span>
                  ))}
                  {selected.locations.map((loc) => (
                    <span key={loc} className="chip">📍 {loc}</span>
                  ))}
                </div>
                <div className="chip-wrap compact">
                  {selected.categories.map((item) => (
                    <span key={item} className="chip">{item}</span>
                  ))}
                </div>
                <h4>Required Skills</h4>
                <div className="chip-wrap compact">
                  {selected.requiredSkills.map((item) => (
                    <span key={item} className="chip active">{item}</span>
                  ))}
                </div>
              </aside>

              <article className="main-overview">
                {tab === "summary" ? (
                  <>
                    <p className="summary-callout">{selected.summary}</p>
                    <SectionList title="Requirements" items={selected.requirements} />
                    <SectionList title="Responsibilities" items={selected.responsibilities} />
                    <SectionList title="Desired Qualifications" items={selected.desiredQualifications} />
                  </>
                ) : (
                  <p className="long-text">{selected.fullPosting}</p>
                )}
              </article>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function SectionList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="section-list">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { analyzeResume, generateAnswer } from "@/lib/api-client";
import { ModernPageHeader } from "@/components/modern-page-header";
import { PageMetrics } from "@/components/page-metrics";
import { ResumeAnalyzeResponse } from "@/lib/types";

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? "#1f8b4d" : score >= 50 ? "#d97706" : "#b63737";
  return (
    <div className="score-badge-container">
      <svg className="score-ring" viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r="32"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={`${(score / 100) * 201} 201`}
          strokeLinecap="round"
          strokeDashoffset="0"
          transform="rotate(-90 40 40)"
        />
      </svg>
      <span className="score-badge-value" style={{ color }}>{score}</span>
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button className="ghost small copy-btn" onClick={handleCopy} disabled={!text} aria-label={label}>
      {copied ? "✓ Copied!" : "⧉ Copy"}
    </button>
  );
}

function formatAnalysis(result: ResumeAnalyzeResponse): string {
  return [
    `Match Score: ${result.score}/100`,
    `\nSummary:\n${result.summary}`,
    `\nStrengths:\n${result.strengths.map((s) => `• ${s}`).join("\n")}`,
    `\nGaps:\n${result.gaps.map((g) => `• ${g}`).join("\n")}`,
    `\nSuggestions:\n${result.suggestions.map((s) => `• ${s}`).join("\n")}`,
    `\nKey Terms: ${result.extractedKeywords.join(", ")}`,
  ].join("\n");
}

export default function AssistantPage() {
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [question, setQuestion] = useState("Why are you a good fit for this role?");
  const [userId, setUserId] = useState("demo-user");
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalyzeResponse | null>(null);
  const [analysisText, setAnalysisText] = useState("");
  const [answer, setAnswer] = useState("");
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | "">("");
  const [error, setError] = useState("");

  async function handleAnalyze(e: FormEvent) {
    e.preventDefault();
    setLoadingAnalyze(true);
    setError("");
    setAnalysisResult(null);
    try {
      const result = await analyzeResume({ resumeText, jdText: jdText || undefined, jdUrl: jdUrl || undefined, userId });
      setAnalysisResult(result);
      setAnalysisText(formatAnalysis(result));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze resume");
    } finally {
      setLoadingAnalyze(false);
    }
  }

  async function handleGenerateAnswer() {
    setLoadingAnswer(true);
    setError("");
    try {
      const result = await generateAnswer({ userId, jdText, question, maxLength: 850 });
      setAnswer(result.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate answer");
    } finally {
      setLoadingAnswer(false);
    }
  }

  const canAnalyze = Boolean(resumeText && (jdText || jdUrl));

  return (
    <main className="app-page">
      <ModernPageHeader
        label="AI command center"
        title="Resume scoring and tailored answers"
        subtitle="Run your core AI workflows in a clean, premium workspace with editable outputs and feedback loops."
        actions={[{ href: "/jobs", label: "View Jobs" }, { href: "/onboarding", label: "Update Profile", primary: true }]}
      />

      <PageMetrics
        items={[
          { label: "Match score", value: analysisResult ? `${analysisResult.score}/100` : "—", tone: "hero-stat" },
          { label: "Answers generated", value: answer ? "1" : "0" },
          { label: "Feedback", value: feedback === "up" ? "👍" : feedback === "down" ? "👎" : "—" },
        ]}
      />

      {/* ── Resume Scoring ────────────────────────────────────────────── */}
      <section className="panel-white glass-card assistant-section">
        <h2>Resume-to-JD Scoring Agent</h2>
        <p className="muted">Paste your resume and a job description (or URL) to get an AI match score and improvement tips.</p>

        <form onSubmit={handleAnalyze} className="stack">
          <label className="field-label" htmlFor="userId-field">User ID</label>
          <input id="userId-field" className="field" value={userId} onChange={(e) => setUserId(e.target.value)} />

          <div className="grid-two">
            <div className="stack">
              <label className="field-label" htmlFor="resume-field">Resume Text</label>
              <textarea
                id="resume-field"
                className="field text-area"
                rows={10}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your full resume text here…"
              />
            </div>
            <div className="stack">
              <label className="field-label" htmlFor="jd-field">Job Description Text</label>
              <textarea
                id="jd-field"
                className="field text-area"
                rows={10}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the job description here…"
              />
              <label className="field-label" htmlFor="jd-url-field">— or JD URL —</label>
              <input
                id="jd-url-field"
                className="field"
                value={jdUrl}
                onChange={(e) => setJdUrl(e.target.value)}
                placeholder="https://company.com/careers/role"
                type="url"
              />
            </div>
          </div>

          <button className="primary" disabled={loadingAnalyze || !canAnalyze} type="submit">
            {loadingAnalyze ? (
              <span className="btn-loading">
                <span className="spinner" aria-hidden="true" /> Analyzing with AI…
              </span>
            ) : (
              "Analyze Resume"
            )}
          </button>
        </form>
      </section>

      {/* ── Analysis Output ───────────────────────────────────────────── */}
      <section className="panel-white glass-card assistant-section">
        <div className="section-top-row">
          <h2>Analysis Output</h2>
          <div className="row-gap">
            <CopyButton text={analysisText} label="Copy analysis" />
            <button className={`ghost small ${feedback === "up" ? "feedback-on" : ""}`} onClick={() => setFeedback("up")} aria-label="Mark helpful">
              👍 Helpful
            </button>
            <button className={`ghost small ${feedback === "down" ? "feedback-on" : ""}`} onClick={() => setFeedback("down")} aria-label="Mark not helpful">
              👎 Not helpful
            </button>
          </div>
        </div>

        {analysisResult && (
          <div className="score-and-summary">
            <ScoreBadge score={analysisResult.score} />
            <p className="score-summary">{analysisResult.summary}</p>
          </div>
        )}

        <textarea
          className="field text-area"
          rows={14}
          value={analysisText}
          onChange={(e) => setAnalysisText(e.target.value)}
          placeholder="Run an analysis to see results here. Results are editable."
          aria-label="Analysis output — editable"
        />
      </section>

      {/* ── Tailored Answer ───────────────────────────────────────────── */}
      <section className="panel-white glass-card assistant-section">
        <h2>Tailored Answer Agent</h2>
        <p className="muted">Generate a personalized answer to any application question using your profile and the JD above.</p>

        <label className="field-label" htmlFor="question-field">Application Question</label>
        <input
          id="question-field"
          className="field"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Why are you a good fit for this role?"
        />

        <div className="row-gap">
          <button className="primary" onClick={handleGenerateAnswer} disabled={loadingAnswer || !jdText || !question}>
            {loadingAnswer ? (
              <span className="btn-loading">
                <span className="spinner" aria-hidden="true" /> Generating…
              </span>
            ) : (
              "Generate Answer"
            )}
          </button>
          {answer && (
            <button className="ghost small" onClick={handleGenerateAnswer} disabled={loadingAnswer}>
              ↺ Regenerate
            </button>
          )}
        </div>

        <div className="section-top-row" style={{ marginTop: "0.6rem" }}>
          <label className="field-label" htmlFor="answer-field">Generated Answer (Editable)</label>
          <CopyButton text={answer} label="Copy answer" />
        </div>
        <textarea
          id="answer-field"
          className="field text-area"
          rows={8}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your tailored answer will appear here…"
          aria-label="Generated answer — editable"
        />

        {error && <p className="error-text" role="alert">{error}</p>}
      </section>
    </main>
  );
}

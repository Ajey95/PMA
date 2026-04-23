"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  aiSpecializations,
  companySizeOptions,
  industries,
  leadershipOptions,
  locationOptions,
  roleFamilies,
  roleLevelOptions,
  skillPool,
  valueOptions,
} from "@/lib/mock-data";

type FormState = {
  values: string[];
  roleFamilies: string[];
  roleSpecializations: string[];
  locations: Record<string, string[]>;
  roleLevels: string[];
  leadership: string[];
  companySizes: string[];
  industriesIn: string[];
  industriesOut: string[];
  skillsIn: string[];
  skillsOut: string[];
  salaryMinimumUsd: number;
  status: string;
};

const progress = [11, 22, 33, 40, 50, 60, 70, 80, 100];

const stepNames = [
  "Values in a New Role",
  "Role Interests",
  "Work Location",
  "Role Level",
  "Company Size",
  "Industry Preferences",
  "Skills",
  "Minimum Salary",
  "Job Search Status",
];

const emptyState: FormState = {
  values: [],
  roleFamilies: [],
  roleSpecializations: [],
  locations: {},
  roleLevels: [],
  leadership: [],
  companySizes: [],
  industriesIn: [],
  industriesOut: [],
  skillsIn: ["Adobe Illustrator"],
  skillsOut: [],
  salaryMinimumUsd: 0,
  status: "",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<FormState>(emptyState);
  const [roleSearch, setRoleSearch] = useState("");
  const [skillSearch, setSkillSearch] = useState("");

  const canContinue = useMemo(() => {
    if (step === 0) return state.values.length > 0;
    if (step === 1) return state.roleFamilies.length > 0;
    if (step === 2) return Object.values(state.locations).flat().length > 0;
    if (step === 3) return state.roleLevels.length > 0;
    if (step === 4) return state.companySizes.length > 0;
    if (step === 5) return state.industriesIn.length > 0;
    if (step === 6) return state.skillsIn.length > 0;
    if (step === 7) return true;
    if (step === 8) return Boolean(state.status);
    return false;
  }, [state, step]);

  function toggleLimited(list: string[], item: string, limit: number): string[] {
    if (list.includes(item)) return list.filter((x) => x !== item);
    if (list.length >= limit) return list;
    return [...list, item];
  }

  function toggleMany(list: string[], item: string): string[] {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  }

  const filteredFamilies = Object.entries(roleFamilies).map(([family, roles]) => {
    const chips = roles.filter((role) => role.toLowerCase().includes(roleSearch.toLowerCase()));
    return [family, chips] as const;
  });

  return (
    <main className="app-page">
      <section className="modern-page-hero glass">
        <div>
          <p className="hero-label">Guided setup</p>
          <h1>Build your AI job profile</h1>
          <p className="hero-subtext">A multi-step, high-signal onboarding flow that powers autofill, ranking, and AI answers.</p>
        </div>
      </section>

      <div className="wizard-frame">
        <div className="wizard-top">
          <button className="ghost" type="button" onClick={() => (step === 0 ? router.push("/") : setStep((prev) => Math.max(0, prev - 1)))}>
            {step === 0 ? "← Back to home" : "← Back"}
          </button>
          <div className="wizard-progress-col">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress[step]}%` }} />
            </div>
            <span className="progress-step-name">Step {step + 1} of {progress.length} — {stepNames[step]}</span>
          </div>
          <span className="progress-label">{progress[step]}%</span>
        </div>

        {step === 0 && (
          <section className="wizard-section">
            <h1>Let&apos;s get started! What do you value in a new role?</h1>
            <p className="muted">Select up to 3</p>
            <div className="chip-wrap">
              {valueOptions.map((item) => (
                <button
                  key={item}
                  className={`chip ${state.values.includes(item) ? "active" : ""}`}
                  onClick={() => setState((s) => ({ ...s, values: toggleLimited(s.values, item, 3) }))}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="wizard-section">
            <h1>What kinds of roles are you interested in?</h1>
            <p className="muted">Select up to 5</p>
            <input
              className="field"
              placeholder="Search by job title"
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
            />
            {filteredFamilies.map(([family, chips]) => (
              <div key={family} className="family-block">
                <h3>{family}</h3>
                <div className="chip-wrap">
                  {chips.map((item) => (
                    <button
                      key={item}
                      className={`chip ${state.roleFamilies.includes(item) ? "active" : ""}`}
                      onClick={() =>
                        setState((s) => ({ ...s, roleFamilies: toggleLimited(s.roleFamilies, item, 5) }))
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {(state.roleFamilies.includes("AI & Machine Learning") || state.roleFamilies.length > 0) && (
              <div className="panel">
                <h3>Specializations</h3>
                <p className="muted">Select the most relevant specializations for you.</p>
                <div className="grid-two">
                  {aiSpecializations.map((item) => (
                    <button
                      key={item}
                      className={`chip card-chip ${state.roleSpecializations.includes(item) ? "active" : ""}`}
                      onClick={() =>
                        setState((s) => ({ ...s, roleSpecializations: toggleMany(s.roleSpecializations, item) }))
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="wizard-section">
            <h1>Where would you like to work?</h1>
            {Object.entries(locationOptions).map(([country, cities]) => {
              const selected = state.locations[country] ?? [];
              return (
                <div key={country} className="country-block">
                  <div className="row-between">
                    <h3>{country}</h3>
                    <button
                      className="ghost small"
                      onClick={() => setState((s) => ({ ...s, locations: { ...s.locations, [country]: cities } }))}
                    >
                      Select all in {country}
                    </button>
                  </div>
                  <div className="grid-two">
                    {cities.map((city) => (
                      <button
                        key={city}
                        className={`choice ${selected.includes(city) ? "active" : ""}`}
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            locations: {
                              ...s.locations,
                              [country]: selected.includes(city)
                                ? selected.filter((x) => x !== city)
                                : [...selected, city],
                            },
                          }))
                        }
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                  <button className="inline-link">+ Add Location</button>
                </div>
              );
            })}
          </section>
        )}

        {step === 3 && (
          <section className="wizard-section">
            <h1>What level of roles are you looking for?</h1>
            <p className="muted">Select up to 2</p>
            {roleLevelOptions.map((item) => (
              <button
                key={item}
                className={`choice ${state.roleLevels.includes(item) ? "active" : ""}`}
                onClick={() => setState((s) => ({ ...s, roleLevels: toggleLimited(s.roleLevels, item, 2) }))}
              >
                {item}
              </button>
            ))}
            {(state.roleLevels.includes("Senior (5 to 8 years)") ||
              state.roleLevels.includes("Expert & Leadership (9+ years)")) && (
              <div className="panel">
                <h3>Are you looking for a specific leadership role?</h3>
                {leadershipOptions.map((item) => (
                  <button
                    key={item}
                    className={`choice ${state.leadership.includes(item) ? "active" : ""}`}
                    onClick={() => setState((s) => ({ ...s, leadership: [item] }))}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {step === 4 && (
          <section className="wizard-section">
            <h1>What is your ideal company size?</h1>
            <button className="ghost small" onClick={() => setState((s) => ({ ...s, companySizes: [] }))}>
              Unselect all sizes
            </button>
            <div className="grid-two">
              {companySizeOptions.map((item) => (
                <button
                  key={item}
                  className={`choice ${state.companySizes.includes(item) ? "active" : ""}`}
                  onClick={() => setState((s) => ({ ...s, companySizes: toggleMany(s.companySizes, item) }))}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="wizard-section">
            <h1>What industries are exciting to you?</h1>
            <p className="muted">First, what industries are exciting to you?</p>
            <div className="chip-wrap">
              {industries.map((item) => (
                <button
                  key={`in-${item}`}
                  className={`chip ${state.industriesIn.includes(item) ? "active" : ""}`}
                  onClick={() => setState((s) => ({ ...s, industriesIn: toggleMany(s.industriesIn, item) }))}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="panel">
              <p className="muted">Second, are there any industries you do not want to work in?</p>
              <div className="chip-wrap">
                {industries.map((item) => (
                  <button
                    key={`out-${item}`}
                    className={`chip ${state.industriesOut.includes(item) ? "active-negative" : ""}`}
                    onClick={() => setState((s) => ({ ...s, industriesOut: toggleMany(s.industriesOut, item) }))}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 6 && (
          <section className="wizard-section">
            <h1>What skills do you have or enjoy working with?</h1>
            <p className="muted">Select all that applies.</p>
            <input
              className="field"
              placeholder="Search all skills"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
            />
            <div className="chip-wrap">
              {skillPool
                .filter((item) => item.toLowerCase().includes(skillSearch.toLowerCase()))
                .map((item) => (
                  <button
                    key={item}
                    className={`chip ${state.skillsIn.includes(item) ? "active" : ""}`}
                    onClick={() => setState((s) => ({ ...s, skillsIn: toggleMany(s.skillsIn, item) }))}
                  >
                    {item}
                  </button>
                ))}
            </div>
            <h3>Selected skills</h3>
            <div className="chip-wrap">
              {state.skillsIn.map((skill) => (
                <span key={skill} className="chip active">
                  {skill}
                </span>
              ))}
            </div>
            <div className="panel">
              <p className="muted">Are there any skills you do not want to work with?</p>
              <div className="chip-wrap">
                {skillPool.map((item) => (
                  <button
                    key={`out-skill-${item}`}
                    className={`chip ${state.skillsOut.includes(item) ? "active-negative" : ""}`}
                    onClick={() => setState((s) => ({ ...s, skillsOut: toggleMany(s.skillsOut, item) }))}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 7 && (
          <section className="wizard-section">
            <h1>What is your minimum expected salary?</h1>
            <div className="salary-badge">
              <span>At least</span>
              <strong>${state.salaryMinimumUsd.toLocaleString()}k</strong>
              <small>USD</small>
            </div>
            <input
              className="slider"
              type="range"
              min={0}
              max={450}
              value={state.salaryMinimumUsd}
              onChange={(e) => setState((s) => ({ ...s, salaryMinimumUsd: Number(e.target.value) }))}
            />
          </section>
        )}

        {step === 8 && (
          <section className="wizard-section">
            <h1>Lastly, what&apos;s the status of your job search?</h1>
            {["Actively looking", "Not looking but open to offers", "Not looking and closed to offers"].map((item) => (
              <button
                key={item}
                className={`choice ${state.status === item ? "active" : ""}`}
                onClick={() => setState((s) => ({ ...s, status: item }))}
              >
                {item}
              </button>
            ))}
            <Link href="/jobs" className="inline-link">
              See Results Example →
            </Link>
          </section>
        )}

        <div className="wizard-footer">
          <button
            className="primary"
            disabled={!canContinue}
            onClick={() => {
              if (step < 8) {
                setStep((s) => Math.min(8, s + 1));
              } else {
                router.push("/profile?onboarded=1");
              }
            }}
          >
            {step < 8 ? "Save and Continue →" : "Finish Setup →"}
          </button>
        </div>
      </div>
    </main>
  );
}

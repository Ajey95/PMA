"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

const featureCards = [
  {
    icon: "🚀",
    title: "Onboarding Wizard",
    description: "Set up your profile in seconds with guided AI steps.",
    href: "/onboarding",
  },
  {
    icon: "🔍",
    title: "Smart Job Search",
    description: "Find the most relevant jobs tailored to your skills.",
    href: "/jobs",
  },
  {
    icon: "📄",
    title: "Resume Analyzer",
    description: "AI scores your resume and suggests improvements.",
    href: "/assistant",
  },
  {
    icon: "📊",
    title: "Application Dashboard",
    description: "Track all your applications in one place.",
    href: "/dashboard",
  },
  {
    icon: "⚙️",
    title: "Profile & Settings",
    description: "Customize preferences and AI behavior.",
    href: "/profile",
  },
  {
    icon: "🤖",
    title: "Tailored Answer Agent",
    description: "Generate high-quality, personalized responses instantly.",
    href: "/assistant",
  },
];

const testimonials = [
  {
    initials: "AK",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=220&h=220&fit=crop&crop=faces&auto=format&q=80",
    name: "Aisha Khan",
    role: "ML Engineer",
    quote: "I went from scattered applications to interview-ready submissions in one workflow.",
  },
  {
    initials: "DP",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=220&h=220&fit=crop&crop=faces&auto=format&q=80",
    name: "Daniel Park",
    role: "Product Analyst",
    quote: "Resume scoring plus tailored answers gave me a huge confidence and quality boost.",
  },
  {
    initials: "SM",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=220&h=220&fit=crop&crop=faces&auto=format&q=80",
    name: "Sofia Mendes",
    role: "Frontend Developer",
    quote: "The dashboard clarity is incredible. I can finally see where every application stands.",
  },
];

const companyLogos = [
  { src: "/logos/acme.svg", alt: "Acme" },
  { src: "/logos/novalabs.svg", alt: "Nova Labs" },
  { src: "/logos/blueorbit.svg", alt: "BlueOrbit" },
  { src: "/logos/horizon-ai.svg", alt: "Horizon AI" },
  { src: "/logos/nextwave.svg", alt: "NextWave" },
];

export default function Home() {
  const [isDark, setIsDark] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [previewStats, setPreviewStats] = useState([72, 86, 64, 91]);
  const revealRef = useRef<HTMLDivElement | null>(null);
  const sectionClass = useMemo(() => "landing-section reveal-up", []);

  useEffect(() => {
    document.body.classList.toggle("landing-dark", isDark);
    return () => document.body.classList.remove("landing-dark");
  }, [isDark]);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPreviewStats((prev) => prev.map((value, index) => Math.max(36, Math.min(96, value + (index % 2 === 0 ? 1 : -1) * 2))));
    }, 1600);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="landing-shell" ref={revealRef}>
      <div className="landing-noise" />
      <div className="landing-content">
      <header className="landing-nav glass" data-reveal>
        <div className="brand">AI Job Assistant</div>
        <button type="button" className="nav-toggle" onClick={() => setNavOpen((v) => !v)}>
          ☰
        </button>
        <nav className={`landing-links ${navOpen ? "open" : ""}`}>
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#proof">Testimonials</a>
          <a href="#preview">Preview</a>
        </nav>
        <button type="button" className="mode-switch" onClick={() => setIsDark((v) => !v)}>
          {isDark ? "☀ Light" : "🌙 Dark"}
        </button>
      </header>

      <section className="landing-hero" data-reveal>
        <div className="hero-copy">
          <p className="hero-label">AI-Powered Job Application Assistant</p>
          <h1>Land Your Dream Job Faster with AI</h1>
          <p className="hero-subtext">
            Automate job search, optimize resumes, and generate tailored answers with intelligent workflows.
          </p>
          <div className="hero-cta-row">
            <Link href="/onboarding" className="cta-btn cta-primary ripple">
              Get Started Free
            </Link>
            <a href="#how" className="cta-btn cta-secondary">
              See How It Works
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-card glass float-a">
            <h4>Resume Match</h4>
            <strong>{previewStats[0]}%</strong>
            <span>+12% in one pass</span>
          </div>
          <div className="floating-card glass float-b">
            <h4>Interview Readiness</h4>
            <strong>{(previewStats[1] / 20).toFixed(1)}/5</strong>
            <span>Tailored answer quality</span>
          </div>
          <div className="dashboard-preview glass">
            <div className="preview-row">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
            <div className="preview-grid">
              <div className="mini-block" style={{ height: `${Math.max(60, previewStats[0])}px` }} />
              <div className="mini-block" style={{ height: `${Math.max(60, previewStats[1])}px` }} />
              <div className="mini-block tall" style={{ height: `${Math.max(100, previewStats[2] + 50)}px` }} />
              <div className="mini-block" style={{ height: `${Math.max(60, previewStats[3])}px` }} />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className={sectionClass} data-reveal>
        <h2>Everything You Need In One AI Workflow</h2>
        <div className="feature-grid">
          {featureCards.map((item) => (
            <Link key={item.title} href={item.href} className="feature-card glass">
              <span className="feature-icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="how" className={sectionClass} data-reveal>
        <h2>How It Works</h2>
        <div className="stepper">
          <div className="step-item glass">
            <span>1</span>
            <h4>Upload Resume</h4>
            <p>Drop your existing resume and profile details.</p>
          </div>
          <div className="step-line" />
          <div className="step-item glass">
            <span>2</span>
            <h4>AI Analysis</h4>
            <p>Get match scoring, gaps, and tailored suggestions.</p>
          </div>
          <div className="step-line" />
          <div className="step-item glass">
            <span>3</span>
            <h4>Apply Smarter</h4>
            <p>Generate refined answers and track application outcomes.</p>
          </div>
        </div>
      </section>

      <section id="proof" className={sectionClass} data-reveal>
        <h2>Trusted by 10,000+ Job Seekers</h2>
        <div className="logo-row glass">
          {companyLogos.map((logo) => (
            <Image key={logo.alt} src={logo.src} alt={logo.alt} width={220} height={64} className="company-logo" />
          ))}
        </div>
        <div className="testimonial-grid">
          {testimonials.map((item) => (
            <article key={item.name} className="testimonial-card glass">
              <Image className="testimonial-avatar" src={item.image} alt={item.name} width={44} height={44} />
              <h4>{item.name}</h4>
              <small>{item.role}</small>
              <p>{item.quote}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="preview" className={sectionClass} data-reveal>
        <h2>Live Product Preview</h2>
        <div className="live-preview glass">
          <div className="preview-left">
            <h3>Smart Job Feed</h3>
            <p>Prioritized roles based on your skills, preferences, and target outcomes.</p>
            <ul>
              <li>Adaptive matching and ranking</li>
              <li>One-click save and apply flow</li>
              <li>Real-time status tracking</li>
            </ul>
          </div>
          <div className="preview-right">
            <div className="pulse-card">Interview probability +{previewStats[2]}%</div>
            <div className="pulse-card">Resume alignment {previewStats[0]}/100</div>
            <div className="pulse-card">Answer confidence: {previewStats[3] > 80 ? "High" : "Rising"}</div>
          </div>
        </div>
      </section>

      <section className="landing-cta" data-reveal>
        <div className="cta-banner glass">
          <h2>Start Landing Interviews Today</h2>
          <Link href="/onboarding" className="cta-btn cta-primary ripple">
            Try for Free
          </Link>
        </div>
      </section>

      <Link href="/assistant" className="chat-bubble" aria-label="Open AI assistant">
        AI Copilot
      </Link>

      <div className="mobile-sticky-cta">
        <Link href="/onboarding" className="cta-btn cta-primary ripple">
          Get Started Free
        </Link>
      </div>
      </div>
    </main>
  );
}

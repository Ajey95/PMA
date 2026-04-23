"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/onboarding", label: "Onboarding", icon: "✦" },
  { href: "/jobs", label: "Jobs", icon: "🔍" },
  { href: "/assistant", label: "Assistant", icon: "🤖" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/profile", label: "Profile", icon: "⚙" },
];

export function AppNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isLanding = pathname === "/";
  if (isLanding) return null;

  return (
    <nav className="app-nav glass" aria-label="Main navigation">
      <Link href="/" className="app-nav-brand">
        <span className="app-nav-logo">PMA</span>
        <span className="app-nav-tagline">AI Job Assistant</span>
      </Link>

      <button
        className="app-nav-toggle"
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`hamburger ${open ? "active" : ""}`} />
      </button>

      <ul className={`app-nav-links ${open ? "open" : ""}`} role="list">
        {navItems.slice(1).map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`app-nav-link ${active ? "app-nav-link--active" : ""}`}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
              >
                <span className="app-nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

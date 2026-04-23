import Link from "next/link";

export function ModernPageHeader({
  label,
  title,
  subtitle,
  actions,
}: {
  label: string;
  title: string;
  subtitle: string;
  actions?: Array<{ href: string; label: string; primary?: boolean }>;
}) {
  return (
    <section className="modern-page-hero glass">
      <div>
        <p className="hero-label">{label}</p>
        <h1>{title}</h1>
        <p className="hero-subtext">{subtitle}</p>
      </div>
      {actions ? (
        <div className="hero-cta-row">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`cta-btn ${action.primary ? "cta-primary" : "cta-secondary"}`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

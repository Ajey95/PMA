export function PageMetrics({ items }: { items: Array<{ label: string; value: string; tone?: string }> }) {
  return (
    <div className="metrics-row">
      {items.map((item) => (
        <div key={item.label} className="metric-card glass">
          <strong className={item.tone ?? ""}>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

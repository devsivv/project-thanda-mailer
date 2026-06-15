export default function MetricCard({ label, value, accent = false }) {
  return (
    <div className="metric-card">
      <div className="metric-card__label">{label}</div>
      <div className={`metric-card__value${accent ? " metric-card__value--accent" : ""}`}>
        {value}
      </div>
    </div>
  );
}

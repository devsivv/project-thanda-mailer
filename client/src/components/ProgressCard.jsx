export default function ProgressCard({ progress }) {
  if (!progress) return null;

  const pct = Math.round((progress.sent / progress.total) * 100);

  return (
    <div className="progress-card" style={{ marginTop: "14px" }}>
      <div className="progress-card__title">
        <span className="status-dot status-dot--live" />
        Sending Campaign
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-meta">
        <span>Sent <strong>{progress.sent}</strong></span>
        <span>Remaining <strong>{progress.total - progress.sent}</strong></span>
        <span>Total <strong>{progress.total}</strong></span>
      </div>
    </div>
  );
}

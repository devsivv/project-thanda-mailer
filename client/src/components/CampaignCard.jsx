export default function CampaignCard({ campaign }) {
  const { date, recipientCount, sentCount, failedCount, attachmentName, cancelled } = campaign;

  return (
    <div className="history-card">
      <div style={{ minWidth: 0 }}>
        <div className="history-card__date">{date}</div>
        <div className="history-card__attachment">
          {attachmentName !== "None" ? `📎 ${attachmentName}` : "No attachment"}
        </div>
      </div>

      <div className="history-card__stats">
        <div className="history-card__stat">
          <div className="history-card__stat-val">{recipientCount}</div>
          <div className="history-card__stat-key">Recipients</div>
        </div>
        <div className="history-card__stat">
          <div className="history-card__stat-val" style={{ color: "var(--success)" }}>
            {sentCount}
          </div>
          <div className="history-card__stat-key">SMTP Accepted</div>
        </div>
        <div className="history-card__stat">
          <div
            className="history-card__stat-val"
            style={{ color: failedCount > 0 ? "var(--danger)" : "var(--text-2)" }}
          >
            {failedCount}
          </div>
          <div className="history-card__stat-key">SMTP Rejected</div>
        </div>
      </div>

      <span className={`badge ${cancelled ? "badge--warning" : "badge--success"}`}>
        {cancelled ? "Cancelled" : "Completed"}
      </span>
    </div>
  );
}

export default function CampaignCard({ campaign }) {
  const { date, subject, recipientCount, sentCount, failedCount, attachmentName, cancelled } = campaign;
  const successRate = recipientCount > 0 ? Math.round((sentCount / recipientCount) * 100) : 0;

  return (
    <div className="history-card">
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="history-card__date">{date}</div>
        {subject && (
          <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {subject}
          </div>
        )}
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
          <div className="history-card__stat-key">Delivered</div>
        </div>
        <div className="history-card__stat">
          <div
            className="history-card__stat-val"
            style={{ color: failedCount > 0 ? "var(--danger)" : "var(--text-2)" }}
          >
            {failedCount}
          </div>
          <div className="history-card__stat-key">Failed</div>
        </div>
        <div className="history-card__stat">
          <div className="history-card__stat-val" style={{ color: "var(--accent)" }}>
            {successRate}%
          </div>
          <div className="history-card__stat-key">Success</div>
        </div>
      </div>

      <span className={`badge ${cancelled ? "badge--warning" : "badge--success"}`}>
        {cancelled ? "Cancelled" : "Completed"}
      </span>
    </div>
  );
}

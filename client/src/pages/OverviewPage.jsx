import MetricCard from "../components/MetricCard";

export default function OverviewPage({
  campaignHistory,
  totalRecipients,
  totalAccepted,
  navigate,
}) {
  const successRate = totalRecipients > 0
    ? `${Math.round((totalAccepted / totalRecipients) * 100)}%`
    : "—";

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Overview</div>
          <div className="page-subtitle">Your campaign summary at a glance</div>
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard label="Campaigns Run"     value={campaignHistory.length} />
        <MetricCard label="Total Recipients"  value={totalRecipients} />
        <MetricCard label="Delivered"         value={totalAccepted} />
        <MetricCard label="Success Rate"      value={successRate} accent />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px" }}>
        <div className="card">
          <div className="card__title">Recent Campaigns</div>
          {campaignHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📭</div>
              <div className="empty-state__title">No campaigns yet</div>
              <div className="empty-state__desc">
                Launch your first campaign from the Outreach Builder to see results here.
              </div>
            </div>
          ) : (
            campaignHistory.slice(0, 5).map((h, i) => (
              <div key={i} className="campaign-list-item">
                <div>
                  <div className="campaign-list-item__name">{h.subject || h.date}</div>
                  <div className="campaign-list-item__meta">
                    {h.sentCount} delivered · {h.failedCount} failed · {h.recipientCount} total · {h.date}
                  </div>
                </div>
                <span className={`badge ${h.cancelled ? "badge--warning" : "badge--success"}`}>
                  {h.cancelled ? "Cancelled" : "Completed"}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card__title">Quick Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button className="btn btn--primary btn--full"   aria-label="Start a new campaign" onClick={() => navigate("outreach")}>New Campaign</button>
            <button className="btn btn--secondary btn--full" aria-label="Manage templates"     onClick={() => navigate("templates")}>Templates</button>
            <button className="btn btn--secondary btn--full" aria-label="View campaign results" onClick={() => navigate("campaign-results")}>Campaign Results</button>
            <button className="btn btn--secondary btn--full" aria-label="View campaign history" onClick={() => navigate("history")}>Campaign History</button>
          </div>
        </div>
      </div>
    </div>
  );
}

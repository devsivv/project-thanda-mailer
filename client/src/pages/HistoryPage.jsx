import CampaignCard from "../components/CampaignCard";

export default function HistoryPage({ campaignHistory }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">History</div>
          <div className="page-subtitle">All campaigns from this session</div>
        </div>
      </div>

      {campaignHistory.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">📭</div>
            <div className="empty-state__title">No campaigns yet</div>
            <div className="empty-state__desc">
              Your campaign history will appear here after your first launch.
            </div>
          </div>
        </div>
      ) : (
        <div className="history-grid">
          {campaignHistory.map((h, i) => (
            <CampaignCard key={i} campaign={h} />
          ))}
        </div>
      )}
    </div>
  );
}

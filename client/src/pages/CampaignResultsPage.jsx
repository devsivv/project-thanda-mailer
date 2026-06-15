import { useState } from "react";
import MetricCard from "../components/MetricCard";

export default function CampaignResultsPage({ lastCampaignResults }) {
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const resultsList = lastCampaignResults?.results || [];

  // Filter list by query & category
  const filteredResults = resultsList.filter((r) => {
    if (filter === "Accepted" && r.status !== "Accepted") return false;
    if (filter === "Rejected" && r.status !== "Rejected") return false;
    if (searchQuery.trim() !== "") {
      return r.email.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const totalRows = filteredResults.length;
  const totalPages = Math.ceil(totalRows / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const paginatedResults = filteredResults.slice(startIndex, startIndex + pageSize);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Campaign Results</div>
          <div className="page-subtitle">Actual SMTP sending results for your latest campaign</div>
        </div>
      </div>

      {lastCampaignResults && resultsList.length > 0 ? (
        <>
          <div className="metric-grid">
            <MetricCard label="Total Recipients" value={lastCampaignResults.total} />
            <MetricCard label="SMTP Accepted" value={lastCampaignResults.acceptedCount} />
            <MetricCard label="SMTP Rejected" value={lastCampaignResults.rejectedCount} />
            <MetricCard label="Success Rate" value={lastCampaignResults.successRate} accent />
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", gap: "16px", flexWrap: "wrap" }}>
              <div className="card__title" style={{ marginBottom: 0 }}>Recipient Sending Status</div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="text"
                  className="field__input"
                  style={{ width: "220px", marginBottom: 0, padding: "6px 12px", fontSize: "13px" }}
                  placeholder="Search email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <div style={{ display: "flex", gap: "6px" }}>
                  {["All", "Accepted", "Rejected"].map((opt) => (
                    <button
                      key={opt}
                      className={`btn ${filter === opt ? "btn--primary" : "btn--secondary"} btn--sm`}
                      style={{ padding: "6px 14px", fontSize: "12px" }}
                      onClick={() => {
                        setFilter(opt);
                        setCurrentPage(1);
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {paginatedResults.length > 0 ? (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedResults.map((r, i) => (
                        <tr key={i}>
                          <td>{r.email}</td>
                          <td>
                            <span className={`badge ${r.status === "Accepted" ? "badge--success" : "badge--danger"}`}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ color: "var(--danger)", fontSize: "12px" }}>{r.error || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalRows > pageSize && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
                    <span style={{ fontSize: "12.5px", color: "var(--text-2)" }}>
                      Showing {startIndex + 1} to {Math.min(startIndex + pageSize, totalRows)} of {totalRows} results
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn btn--secondary btn--sm"
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                        disabled={activePage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </button>
                      <button
                        className="btn btn--secondary btn--sm"
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                        disabled={activePage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-3)", fontSize: "13.5px" }}>
                No matching results found.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">📊</div>
            <div className="empty-state__title">No campaign results available yet.</div>
            <div className="empty-state__desc">
              Send a campaign to view results.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

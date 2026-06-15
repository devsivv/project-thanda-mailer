import { useState } from "react";
import ProgressCard from "../components/ProgressCard";

export default function OutreachBuilderPage({
  // Campaign settings
  gmail, setGmail,
  appPassword, setAppPassword,
  delay, setDelay,
  // Recipients
  fileName, handleFileChange, uploadCsv,
  // Email content
  subject, setSubject,
  body, setBody,
  // Templates
  templateName, setTemplateName,
  savedTemplates, saveTemplate, loadTemplate,
  // Attachment
  attachment, setAttachment,
  // Sending
  contacts, sending, lastCampaignId,
  sendEmails, sendTestEmail, stopCampaign,
  // State
  progress, sendResults, previews, templateMessage,
}) {
  const [visibleCount, setVisibleCount] = useState(15);
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Outreach Builder</div>
          <div className="page-subtitle">Build, personalize, and launch your campaign</div>
        </div>
        {contacts.length > 0 && (
          <span className="contacts-pill">✓ {contacts.length} contacts loaded</span>
        )}
      </div>

      <div className="builder-grid">
        {/* ── LEFT: Editor ── */}
        <div className="builder-editor">

          {/* Campaign Settings */}
          <div className="card">
            <div className="card__title">Campaign Settings</div>
            <div className="field">
              <label className="field__label">Gmail Address</label>
              <input
                className="field__input"
                type="email"
                value={gmail}
                onChange={(e) => setGmail(e.target.value)}
                placeholder="you@gmail.com"
              />
            </div>
            <div className="field">
              <label className="field__label">App Password</label>
              <input
                className="field__input"
                type="password"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="Gmail App Password"
              />
              <div className="field__hint">Google Account → Security → App Passwords</div>
            </div>
            <div className="field">
              <label className="field__label">Send Speed</label>
              <select
                className="field__input"
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
              >
                <option value={3000}>Safe (3000ms)</option>
                <option value={2000}>Normal (2000ms)</option>
                <option value={1000}>Fast (1000ms)</option>
              </select>
            </div>
          </div>

          {/* Recipients */}
          <div className="card">
            <div className="card__title">Recipients</div>
            <div className="field">
              <label className="field__label">Upload CSV</label>
              <input
                className="field__file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />
              {fileName && (
                <div className="field__hint" style={{ marginTop: "6px", color: "var(--text)" }}>
                  Selected file: <strong>{fileName}</strong>
                </div>
              )}
              <div className="field__hint">
                Upload a CSV containing your recipients.<br/><br/>
                Required columns:<br/>
                • name<br/>
                • email<br/>
                • company<br/><br/>
                Example:<br/>
                John Doe, john@example.com, Google
              </div>
              {contacts.length > 0 && <div className="field__success">✓ {contacts.length} recipients loaded successfully</div>}
            </div>
            <button
              className="btn btn--secondary btn--full"
              onClick={uploadCsv}
              style={{ marginTop: "6px" }}
            >
              Preview &amp; Load Contacts
            </button>
          </div>

          {/* Email Content */}
          <div className="card" id="email-content-section">
            <div className="card__title">Email Content</div>
            <div className="tag-row">
              <span className="tag">{"{{name}}"}</span>
              <span className="tag">{"{{company}}"}</span>
              <span className="tag">{"{{email}}"}</span>
            </div>
            <div className="field">
              <label className="field__label">Subject Line</label>
              <input
                className="field__input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>
            <div className="field">
              <label className="field__label">Email Body</label>
              <textarea
                className="field__textarea"
                rows="14"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div className="divider" />
            <div className="card__title" style={{ marginBottom: "12px" }}>Save / Load Template</div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <input
                className="field__input"
                type="text"
                placeholder="Template name..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
              <button className="btn btn--secondary" onClick={saveTemplate} style={{ flexShrink: 0 }}>
                Save
              </button>
            </div>
            {templateMessage && <div className="field__success" style={{ marginTop: "10px", marginBottom: "10px" }}>{templateMessage}</div>}
            {savedTemplates.length > 0 && (
              <select
                className="field__input"
                onChange={(e) => { if (e.target.value !== "") loadTemplate(e.target.value); }}
              >
                <option value="">— Load template —</option>
                {savedTemplates.map((t, i) => (
                  <option key={i} value={i}>{t.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Attachment */}
          <div className="card">
            <div className="card__title">
              Attachment{" "}
              <span style={{ color: "var(--text-3)", fontWeight: 400, fontSize: "11px", textTransform: "none" }}>
                optional
              </span>
            </div>
            <div className="field">
              <label className="field__label">Attach File</label>
              <input
                className="field__file"
                type="file"
                onChange={(e) => setAttachment(e.target.files[0])}
              />
              <div className="field__hint">PDF, DOCX, or any file to attach to every email</div>
              {attachment && <div className="field__success">✓ {attachment.name}</div>}
            </div>
          </div>

          {/* Action Bar */}
          <div className="action-bar">
            <button className="btn btn--secondary" onClick={sendTestEmail} disabled={sending}>
              Send Test To Myself
            </button>
            <button
              className="btn btn--primary"
              onClick={sendEmails}
              disabled={contacts.length === 0 || sending}
            >
              {sending ? "Sending..." : `Launch Campaign (${contacts.length})`}
            </button>
            {sending && lastCampaignId && (
              <button className="btn btn--danger" onClick={stopCampaign}>
                Stop Sending
              </button>
            )}
          </div>

          {/* Progress */}
          <ProgressCard progress={progress} />

          {/* Campaign Activity Panel */}
          {sending && progress && (
            <div className="card activity-panel">
              <div className="card__title">Campaign Activity</div>
              <div className="activity-panel__stats">
                <span>Sent: <strong>{progress.sent}</strong></span>
                <span>Failed: <strong>{progress.failed}</strong></span>
                <span>Remaining: <strong>{progress.total - progress.sent - progress.failed}</strong></span>
              </div>
              {progress.currentRecipient && (
                <div className="activity-panel__recipient">
                  Sending To: <strong>{progress.currentRecipient}</strong>
                </div>
              )}
              <div className="activity-panel__recent-title">Recent Activity:</div>
              <div className="activity-panel__list">
                {(progress.recentActivity || []).slice(0, visibleCount).map((act, i) => (
                  <div key={i} className={act.status === "Sent" ? "activity-panel__item--success" : "activity-panel__item--danger"}>
                    {act.status === "Sent" ? "✓" : "✗"} {act.email}
                  </div>
                ))}
              </div>
              {progress.recentActivity && progress.recentActivity.length > 15 && (
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  {visibleCount < progress.recentActivity.length && (
                    <button className="btn btn--secondary btn--sm" style={{ padding: "4px 10px", fontSize: "11.5px" }} onClick={() => setVisibleCount(prev => prev + 15)}>
                      Show More
                    </button>
                  )}
                  {visibleCount > 15 && (
                    <button className="btn btn--secondary btn--sm" style={{ padding: "4px 10px", fontSize: "11.5px" }} onClick={() => setVisibleCount(15)}>
                      Show Less
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Send Results */}
          {sendResults && (
            <div className="card" style={{ marginTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
                <div className="card__title" style={{ marginBottom: 0 }}>
                  {sendResults.length < contacts.length ? "Campaign Cancelled" : "Campaign Complete"}
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span className="badge badge--success">
                    ✓ {sendResults.filter((r) => r.status === "Sent").length} Sent
                  </span>
                  {sendResults.filter((r) => r.status === "Failed").length > 0 && (
                    <span className="badge badge--danger">
                      ✗ {sendResults.filter((r) => r.status === "Failed").length} Failed
                    </span>
                  )}
                  {contacts.length - sendResults.length > 0 && (
                    <span className="badge badge--warning">
                      ⊘ {contacts.length - sendResults.length} Skipped
                    </span>
                  )}
                </div>
              </div>
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
                    {sendResults.map((r, i) => (
                      <tr key={i}>
                        <td>{r.email}</td>
                        <td style={{ color: r.status === "Sent" ? "var(--success)" : "var(--danger)", fontWeight: 500 }}>
                          {r.status}
                        </td>
                        <td style={{ color: "var(--danger)", fontSize: "12px" }}>{r.error || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Live Preview ── */}
        <div className="builder-preview">
          <div className="card">
            <div className="card__title">Live Preview</div>
            {previews.length === 0 ? (
              <div className="preview-placeholder">
                <div className="preview-placeholder__title">Preview your email</div>
                <div className="preview-placeholder__desc">
                  Upload a CSV and click "Preview &amp; Load Contacts" to see how
                  your email will appear to recipients.
                </div>
                <div className="preview-placeholder__vars">
                  <span className="tag">{"{{name}}"}</span>
                  <span className="tag">{"{{company}}"}</span>
                  <span className="tag">{"{{email}}"}</span>
                </div>
              </div>
            ) : (
              previews.map((item, i) => (
                <div key={i} className="preview-card">
                  <div className="preview-card__meta">
                    <div className="preview-card__row">
                      <span className="preview-card__row-label">To</span>
                      <span className="preview-card__row-value">{item.email}</span>
                    </div>
                    <div className="preview-card__row">
                      <span className="preview-card__row-label">Name</span>
                      <span className="preview-card__row-value">{item.name}</span>
                    </div>
                    <div className="preview-card__row">
                      <span className="preview-card__row-label">Company</span>
                      <span className="preview-card__row-value">{item.company}</span>
                    </div>
                    <div className="preview-card__row">
                      <span className="preview-card__row-label">Subject</span>
                      <span className="preview-card__row-value" style={{ fontWeight: 500 }}>
                        {item.subject}
                      </span>
                    </div>
                  </div>
                  <pre className="preview-card__body">{item.generatedEmail}</pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import ProgressCard from "../components/ProgressCard";

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OutreachBuilderPage({
  delay, setDelay,
  fileName, handleFileChange, uploadCsv,
  subject, setSubject,
  body, setBody,
  templateName, setTemplateName,
  savedTemplates, saveTemplate, loadTemplate,
  attachment, setAttachment,
  contacts, sending, lastCampaignId,
  sendEmails, sendTestEmail, stopCampaign,
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
          <span className="contacts-pill" aria-label={`${contacts.length} contacts loaded`}>✓ {contacts.length} contacts loaded</span>
        )}
      </div>

      <div className="builder-grid">
        {/* ── LEFT: Editor ── */}
        <div className="builder-editor">

          {/* ── Step 1: Recipients ── */}
          <div className="card">
            <div className="section-step">
              <div className="section-step__num" aria-hidden="true">1</div>
              <div className="section-step__label">Upload Recipients</div>
            </div>
            <div className="field" style={{ marginBottom: "10px" }}>
              <label className="field__label" htmlFor="csv-upload">CSV File</label>
              <input
                id="csv-upload"
                className="field__file"
                type="file"
                accept=".csv"
                aria-label="Upload CSV file with recipient list"
                onChange={handleFileChange}
              />
              {fileName && (
                <div className="field__hint" style={{ marginTop: "6px", color: "var(--text)" }}>
                  Selected: <strong>{fileName}</strong>
                </div>
              )}
              <div className="field__hint" style={{ marginTop: "8px" }}>
                Required columns: <strong>name</strong>, <strong>email</strong>, <strong>company</strong>
              </div>
            </div>
            <button
              className="btn btn--secondary btn--full"
              onClick={uploadCsv}
              aria-label="Preview and load contacts from CSV"
            >
              Preview &amp; Load Contacts
            </button>
            {contacts.length > 0 && (
              <div className="field__success" style={{ marginTop: "8px" }}>✓ {contacts.length} recipients loaded</div>
            )}
          </div>

          {/* ── Step 2: Campaign Settings ── */}
          <div className="card">
            <div className="section-step">
              <div className="section-step__num" aria-hidden="true">2</div>
              <div className="section-step__label">Campaign Settings</div>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="send-speed">Send Speed</label>
              <select
                id="send-speed"
                className="field__input"
                value={delay}
                aria-label="Select sending speed"
                onChange={(e) => setDelay(Number(e.target.value))}
              >
                <option value={3000}>Safe — 3 s between emails</option>
                <option value={2000}>Normal — 2 s between emails</option>
                <option value={1000}>Fast — 1 s between emails</option>
              </select>
            </div>
          </div>

          {/* ── Step 3: Email Content ── */}
          <div className="card" id="email-content-section">
            <div className="section-step">
              <div className="section-step__num" aria-hidden="true">3</div>
              <div className="section-step__label">Write Your Email</div>
            </div>
            <div className="tag-row" role="group" aria-label="Available personalization variables">
              <span className="tag" title="Inserts recipient name">{"{{name}}"}</span>
              <span className="tag" title="Inserts company name">{"{{company}}"}</span>
              <span className="tag" title="Inserts recipient email">{"{{email}}"}</span>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="email-subject">Subject Line</label>
              <input
                id="email-subject"
                className="field__input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Quick question for {{name}} at {{company}}"
                aria-label="Email subject line"
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="email-body">Email Body</label>
              <textarea
                id="email-body"
                className="field__textarea"
                rows="14"
                value={body}
                aria-label="Email body content"
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div className="divider" />
            <div className="card__title" style={{ marginBottom: "12px" }}>Templates</div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <input
                className="field__input"
                type="text"
                placeholder="Template name…"
                value={templateName}
                aria-label="Template name"
                onChange={(e) => setTemplateName(e.target.value)}
              />
              <button className="btn btn--secondary" onClick={saveTemplate} aria-label="Save current email as template" style={{ flexShrink: 0 }}>
                Save
              </button>
            </div>
            {templateMessage && (
              <div className="field__success" style={{ marginTop: "10px", marginBottom: "10px" }}>{templateMessage}</div>
            )}
            {savedTemplates.length > 0 && (
              <select
                className="field__input"
                aria-label="Load a saved template"
                onChange={(e) => { if (e.target.value !== "") loadTemplate(e.target.value); }}
              >
                <option value="">— Load template —</option>
                {savedTemplates.map((t, i) => (
                  <option key={i} value={i}>{t.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* ── Step 4: Attachment (optional) ── */}
          <div className="card">
            <div className="section-step">
              <div className="section-step__num" aria-hidden="true">4</div>
              <div className="section-step__label">
                Attachment
                <span className="section-step__optional"> — optional</span>
              </div>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="attachment-file">Attach File</label>
              <input
                id="attachment-file"
                className="field__file"
                type="file"
                aria-label="Attach a file to every email"
                onChange={(e) => setAttachment(e.target.files[0])}
              />
              <div className="field__hint">Attach a PDF, DOCX, or any supporting file to every email in the campaign.</div>
            </div>
            {attachment && (
              <div className="attachment-preview">
                <span className="attachment-preview__icon">📎</span>
                <div className="attachment-preview__info">
                  <div className="attachment-preview__name">{attachment.name}</div>
                  <div className="attachment-preview__size">{formatBytes(attachment.size)}</div>
                </div>
                <button
                  className="btn btn--secondary btn--sm"
                  aria-label="Remove attachment"
                  onClick={() => setAttachment(null)}
                  style={{ marginLeft: "auto", flexShrink: 0 }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* ── Step 5: Send ── */}
          <div className="card">
            <div className="section-step">
              <div className="section-step__num" aria-hidden="true">5</div>
              <div className="section-step__label">Send</div>
            </div>
            <div className="action-bar" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
              <button
                className="btn btn--secondary"
                onClick={sendTestEmail}
                disabled={sending}
                aria-label="Send a test email to verify your template"
              >
                Send Test Email
              </button>
              <button
                className="btn btn--primary"
                onClick={sendEmails}
                disabled={contacts.length === 0 || sending}
                aria-label={`Launch campaign to ${contacts.length} contacts`}
              >
                {sending ? "Sending…" : `Launch Campaign (${contacts.length})`}
              </button>
              {sending && lastCampaignId && (
                <button
                  className="btn btn--danger"
                  onClick={stopCampaign}
                  aria-label="Stop the running campaign"
                >
                  Stop Sending
                </button>
              )}
            </div>
          </div>

          {/* Progress */}
          <ProgressCard progress={progress} />

          {/* Campaign Activity Panel */}
          {sending && progress && (
            <div className="card activity-panel" role="status" aria-live="polite" aria-label="Campaign activity">
              <div className="card__title">Live Activity</div>
              <div className="activity-panel__stats">
                <span>Sent: <strong>{progress.sent}</strong></span>
                <span>Failed: <strong>{progress.failed}</strong></span>
                <span>Remaining: <strong>{Math.max(0, progress.total - progress.sent - progress.failed)}</strong></span>
              </div>
              {progress.currentRecipient && (
                <div className="activity-panel__recipient">
                  Sending to: <strong>{progress.currentRecipient}</strong>
                </div>
              )}
              <div className="activity-panel__recent-title">Recent Activity</div>
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
                    ✓ {sendResults.filter((r) => r.status === "Sent").length} Delivered
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
                          {r.status === "Sent" ? "Delivered" : "Failed"}
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
                  your email will look to each recipient.
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

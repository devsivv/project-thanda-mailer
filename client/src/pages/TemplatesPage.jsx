export default function TemplatesPage({
  savedTemplates,
  templateName, setTemplateName,
  saveTemplate,
  loadTemplate,
  deleteTemplate,
  templateMessage,
  navigate,
}) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Templates</div>
          <div className="page-subtitle">Save and reuse your best-performing emails</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card__title">Save Current Email as Template</div>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            className="field__input"
            type="text"
            placeholder="Template name..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
          <button className="btn btn--primary" onClick={saveTemplate} style={{ flexShrink: 0 }}>
            Save Template
          </button>
        </div>
        <div className="field__hint" style={{ marginTop: "8px" }}>
          Saves the current subject and body from the Outreach Builder.
        </div>
      </div>

      {templateMessage && (
        <div className="field__success" style={{ marginBottom: "20px" }}>
          {templateMessage}
        </div>
      )}

      {savedTemplates.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">📝</div>
            <div className="empty-state__title">No templates yet</div>
            <div className="empty-state__desc">
              Write an email in the Outreach Builder, then save it as a template here.
            </div>
          </div>
        </div>
      ) : (
        <div className="template-grid">
          {savedTemplates.map((t, i) => (
            <div key={i} className="template-card">
              <div className="template-card__name">{t.name}</div>
              <div className="template-card__subject">{t.subject}</div>
              <div className="template-card__preview">{t.body}</div>
              <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                <button
                  className="btn btn--secondary btn--sm" style={{ flex: 1 }}
                  onClick={() => { loadTemplate(i); navigate("outreach"); }}
                >
                  Load Template →
                </button>
                <button
                  className="btn btn--danger btn--sm"
                  onClick={() => deleteTemplate(i)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

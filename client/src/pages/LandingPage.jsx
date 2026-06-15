export default function LandingPage({ navigate }) {
  return (
    <div className="landing">
      <div className="landing__hero">
        <div className="landing__eyebrow">Thanda Mailer</div>
        <h1 className="landing__headline">
          Cold outreach.<br />
          <span>Simplified.</span><br />
          Delivered.
        </h1>
        <p className="landing__sub">
          Send personalized cold emails using your own Gmail account.
          Upload leads. Personalize automatically. Monitor campaign delivery in real-time.
          Manage campaigns from one place.
        </p>
        <div className="landing__cta">
          <button className="btn btn--primary" onClick={() => navigate("outreach")}>
            Get Started
          </button>
          <button className="btn btn--ghost" onClick={() => navigate("setup")}>
            Quick Setup
          </button>
        </div>
      </div>

      <div className="landing__strip">
        {[
          { icon: "✉", label: "Use Your Gmail" },
          { icon: "↑", label: "CSV Powered" },
          { icon: "◈", label: "Personalized Outreach" },
          { icon: "◎", label: "Campaign Results" },
        ].map(({ icon, label }) => (
          <div key={label} className="landing__strip-item">
            <span className="landing__strip-icon">{icon}</span>
            <span className="landing__strip-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="landing__features">
        <div className="landing__feature-card">
          <div className="landing__feature-title">Personalize</div>
          <div className="landing__feature-desc">
            Use variables like <code>{"{{name}}"}</code>,{" "}
            <code>{"{{company}}"}</code>, and <code>{"{{email}}"}</code>{" "}
            to craft personalized outreach at scale — automatically.
          </div>
        </div>
        <div className="landing__feature-card">
          <div className="landing__feature-title">Campaign Results</div>
          <div className="landing__feature-desc">
            Monitor campaign delivery and SMTP accepted/rejected rates in real-time,
            retaining a full breakdown of recipient outcomes.
          </div>
        </div>
        <div className="landing__feature-card">
          <div className="landing__feature-title">Send With Gmail</div>
          <div className="landing__feature-desc">
            Use your own Gmail account securely via App Passwords. No
            third-party email service or subscription required.
          </div>
        </div>
      </div>
    </div>
  );
}

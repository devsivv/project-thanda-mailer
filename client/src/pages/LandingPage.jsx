export default function LandingPage({ navigate }) {
  return (
    <div className="landing">
      <div className="landing__hero">
        <div className="landing__eyebrow">Thanda Mail</div>
        <h1 className="landing__headline">
          Cold outreach.<br />
          <span>Delivered</span><br />
          reliably.
        </h1>
        <p className="landing__sub">
          Send personalized cold emails powered by Resend.
          Upload your leads, personalize automatically, and monitor
          campaign delivery in real-time — from one place.
        </p>
        <div className="landing__cta">
          <button className="btn btn--primary" onClick={() => navigate("outreach")} aria-label="Start building your campaign">
            Get Started
          </button>
        </div>
      </div>

      <div className="landing__strip">
        {[
          { icon: "✦", label: "Reliable Cloud Delivery" },
          { icon: "↑", label: "CSV Powered" },
          { icon: "◈", label: "Personalized Outreach" },
          { icon: "◎", label: "Real-Time Results" },
        ].map(({ icon, label }) => (
          <div key={label} className="landing__strip-item">
            <span className="landing__strip-icon">{icon}</span>
            <span className="landing__strip-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="landing__features">
        <div className="landing__feature-card">
          <div className="landing__feature-title">Personalize at Scale</div>
          <div className="landing__feature-desc">
            Use variables like <code>{"{{name}}"}</code>,{" "}
            <code>{"{{company}}"}</code>, and <code>{"{{email}}"}</code>{" "}
            to craft tailored outreach for every recipient — automatically.
          </div>
        </div>
        <div className="landing__feature-card">
          <div className="landing__feature-title">Live Campaign Results</div>
          <div className="landing__feature-desc">
            Monitor delivery in real-time with a live activity feed.
            Track delivered, failed, and skipped counts with full
            recipient-level breakdowns.
          </div>
        </div>
        <div className="landing__feature-card">
          <div className="landing__feature-title">Powered by Resend</div>
          <div className="landing__feature-desc">
            Enterprise-grade email infrastructure with high deliverability.
            No personal credentials required — just upload your CSV and send.
          </div>
        </div>
      </div>
    </div>
  );
}

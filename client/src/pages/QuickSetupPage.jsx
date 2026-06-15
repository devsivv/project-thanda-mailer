export default function QuickSetupPage() {
  const STEPS = [
    {
      title: "Enable Google 2-Step Verification",
      content: (
        <>
          <p style={{ marginBottom: "8px" }}>Google App Passwords require 2-Step Verification. Enable it from your Google Account security settings.</p>
          <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "underline" }}>
            https://myaccount.google.com/security
          </a>
        </>
      ),
    },
    {
      title: "Create a Gmail App Password",
      content: (
        <>
          <p style={{ marginBottom: "8px" }}>Open the Google App Passwords page:</p>
          <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "underline", display: "inline-block", marginBottom: "12px" }}>
            https://myaccount.google.com/apppasswords
          </a>
          <ol style={{ paddingLeft: "18px", margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
            <li>Open the App Passwords page.</li>
            <li>In the <strong>"App name"</strong> field, enter: <strong>Thanda Mailer</strong></li>
            <li>Click <strong>Create</strong>.</li>
            <li>Google will generate a 16-character App Password.</li>
            <li>Copy the generated password immediately.</li>
            <li>Return to Thanda Mailer.</li>
            <li>Paste the password into the <strong>App Password</strong> field inside Outreach Builder.</li>
          </ol>
        </>
      ),
    },
    {
      title: "Verify Gmail Connection",
      content: (
        <ol style={{ paddingLeft: "18px", margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
          <li>Enter your Gmail address.</li>
          <li>Paste the generated App Password.</li>
          <li>Click <strong>"Send Test To Myself"</strong>.</li>
          <li>Open the inbox of the Gmail account you entered.</li>
          <li>Check Inbox and Spam folders.</li>
          <li>Confirm the test email was received successfully.</li>
          <li>Only after verification, launch your campaign.</li>
        </ol>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Quick Setup</div>
          <div className="page-subtitle">Get Thanda Mailer ready in a few minutes</div>
        </div>
      </div>

      <div className="setup-steps">
        {STEPS.map((step, i) => (
          <div key={i} className="setup-step">
            <div className="setup-step__num">{i + 1}</div>
            <div>
              <div className="setup-step__title">{step.title}</div>
              <div className="setup-step__desc">{step.content}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="creator">
        <div>
          <div className="creator__name">Shivam Dubey</div>
          <div className="creator__sub">Built Thanda Mailer</div>
        </div>
        <a
          href="https://github.com/devsivv"
          target="_blank"
          rel="noopener noreferrer"
          className="creator__link"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          github.com/devsivv
        </a>
      </div>
    </div>
  );
}

import { useState } from "react";

export default function TestEmailModal({ onClose, onSend }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (!email.trim()) return "Recipient email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email address.";
    return "";
  };

  const handleSend = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      await onSend(email.trim());
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="test-email-modal-title">
      <div className="modal-content" style={{ textAlign: "left" }}>
        <div className="modal-title" id="test-email-modal-title" style={{ marginBottom: "8px" }}>
          Send Test Email
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-2)", marginBottom: "20px", lineHeight: 1.55 }}>
          Enter a recipient email address to receive a preview of your campaign email.
        </div>

        <div className="field">
          <label className="field__label" htmlFor="test-email-input">Recipient Email</label>
          <input
            id="test-email-input"
            className="field__input"
            type="email"
            placeholder="you@example.com"
            value={email}
            autoFocus
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            onKeyDown={handleKeyDown}
            aria-describedby={error ? "test-email-error" : undefined}
          />
          {error && (
            <div id="test-email-error" style={{ fontSize: "12px", color: "var(--danger)", marginTop: "5px" }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            className="btn btn--secondary"
            style={{ flex: 1 }}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn--primary"
            style={{ flex: 1 }}
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? "Sending…" : "Send Test"}
          </button>
        </div>
      </div>
    </div>
  );
}

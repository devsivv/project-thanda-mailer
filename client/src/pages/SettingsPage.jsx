import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";

const API_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_URL || "";

// ─── helpers ────────────────────────────────────────────────────────────────
function authHeaders(session) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
  };
}

const EMPTY = {
  provider: "resend",
  sender_email: "",
  smtp_host: "",
  smtp_port: "587",
  smtp_username: "",
  smtp_password: "",
  resend_api_key: "",
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { session } = useAuth();

  const [form, setForm]           = useState(EMPTY);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving]       = useState(false);
  const [testing, setTesting]     = useState(false);
  const [saveMsg, setSaveMsg]     = useState(null); // { type: "success"|"error", text }
  const [testMsg, setTestMsg]     = useState(null);

  useEffect(() => {
    let active = true;
    async function fetchProfile() {
      try {
        const res = await fetch(`${API_URL}/sender-profile`, {
          headers: authHeaders(session),
        });
        const json = await res.json();
        if (active && json.profile) {
          setForm({
            provider:       json.profile.provider       || "resend",
            sender_email:   json.profile.sender_email   || "",
            smtp_host:      json.profile.smtp_host      || "",
            smtp_port:      json.profile.smtp_port      ? String(json.profile.smtp_port) : "587",
            smtp_username:  json.profile.smtp_username  || "",
            smtp_password:  json.profile.smtp_password  || "",
            resend_api_key: json.profile.resend_api_key || "",
          });
        }
      } catch (err) {
        if (active) {
          setSaveMsg({ type: "error", text: "Failed to load profile: " + err.message });
        }
      } finally {
        if (active) {
          setPageLoading(false);
        }
      }
    }

    fetchProfile();
    return () => {
      active = false;
    };
  }, [session]);

  // ── Field helper ─────────────────────────────────────────────────────────
  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setSaveMsg(null);
    setTestMsg(null);
  };

  // ── Validate ─────────────────────────────────────────────────────────────
  function validate() {
    if (!form.sender_email.trim()) return "Sender email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.sender_email.trim())) return "Enter a valid sender email.";
    if (form.provider === "smtp") {
      if (!form.smtp_host.trim())     return "SMTP host is required.";
      if (!form.smtp_port.trim())     return "SMTP port is required.";
      if (!form.smtp_username.trim()) return "SMTP username is required.";
      if (!form.smtp_password.trim()) return "SMTP password is required.";
    }
    if (form.provider === "resend" && !form.resend_api_key.trim()) {
      return "Resend API key is required.";
    }
    return null;
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const err = validate();
    if (err) { setSaveMsg({ type: "error", text: err }); return; }

    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`${API_URL}/sender-profile`, {
        method: "POST",
        headers: authHeaders(session),
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Save failed");
      setSaveMsg({ type: "success", text: "Profile saved successfully." });
    } catch (e) {
      setSaveMsg({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  // ── Test Connection ───────────────────────────────────────────────────────
  const handleTest = async () => {
    const err = validate();
    if (err) { setTestMsg({ type: "error", text: err }); return; }

    setTesting(true);
    setTestMsg(null);
    try {
      const res = await fetch(`${API_URL}/test-connection`, {
        method: "POST",
        headers: authHeaders(session),
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setTestMsg({ type: "success", text: json.message || "Connection successful!" });
      } else {
        setTestMsg({ type: "error", text: json.error || "Connection test failed." });
      }
    } catch (e) {
      setTestMsg({ type: "error", text: "Network error: " + e.message });
    } finally {
      setTesting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="page-title">Settings</div>
            <div className="page-subtitle">Configure your email sender profile</div>
          </div>
        </div>
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div className="settings-spinner" aria-label="Loading profile" />
          <div style={{ color: "var(--text-3)", fontSize: "13px", marginTop: "14px" }}>Loading your profile…</div>
        </div>
      </div>
    );
  }

  const isSmtp   = form.provider === "smtp";
  const isResend = form.provider === "resend";

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Configure your email sender profile</div>
        </div>
      </div>

      {/* ── Provider Card ── */}
      <div className="card settings-card">
        <div className="card__title">Email Provider</div>
        <div className="settings-provider-grid">
          {[
            { value: "resend", label: "Resend", icon: "◈", desc: "API-based delivery. Recommended." },
            { value: "smtp",   label: "SMTP",   icon: "⇄", desc: "Standard SMTP. Use any mail server." },
          ].map((p) => (
            <button
              key={p.value}
              type="button"
              className={`settings-provider-card${form.provider === p.value ? " settings-provider-card--active" : ""}`}
              onClick={() => { setForm((f) => ({ ...f, provider: p.value })); setSaveMsg(null); setTestMsg(null); }}
              aria-pressed={form.provider === p.value}
            >
              <span className="settings-provider-card__icon">{p.icon}</span>
              <span className="settings-provider-card__label">{p.label}</span>
              <span className="settings-provider-card__desc">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Credentials Card ── */}
      <div className="card settings-card">
        <div className="card__title">
          {isResend ? "Resend Credentials" : "SMTP Credentials"}
        </div>

        {/* Sender Email — always shown */}
        <div className="field">
          <label className="field__label" htmlFor="sender-email">
            Sender Email <span className="settings-required">*</span>
          </label>
          <input
            id="sender-email"
            className="field__input"
            type="email"
            placeholder="you@yourdomain.com"
            value={form.sender_email}
            onChange={set("sender_email")}
            aria-label="Sender email address"
          />
          <div className="field__hint">
            {isResend
              ? "Must match a verified domain in your Resend account."
              : "The From address that recipients will see."}
          </div>
        </div>

        {/* ── Resend fields ── */}
        {isResend && (
          <div className="field">
            <label className="field__label" htmlFor="resend-key">
              Resend API Key <span className="settings-required">*</span>
            </label>
            <input
              id="resend-key"
              className="field__input settings-secret"
              type="password"
              placeholder="re_••••••••••••••••••••••"
              value={form.resend_api_key}
              onChange={set("resend_api_key")}
              autoComplete="new-password"
              aria-label="Resend API key"
            />
            <div className="field__hint">
              Get your API key from{" "}
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="settings-link"
              >
                resend.com/api-keys ↗
              </a>
            </div>
          </div>
        )}

        {/* ── SMTP fields ── */}
        {isSmtp && (
          <>
            <div className="settings-row-2">
              <div className="field">
                <label className="field__label" htmlFor="smtp-host">
                  SMTP Host <span className="settings-required">*</span>
                </label>
                <input
                  id="smtp-host"
                  className="field__input"
                  type="text"
                  placeholder="smtp.gmail.com"
                  value={form.smtp_host}
                  onChange={set("smtp_host")}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="smtp-port">
                  Port <span className="settings-required">*</span>
                </label>
                <select
                  id="smtp-port"
                  className="field__input"
                  value={form.smtp_port}
                  onChange={set("smtp_port")}
                  aria-label="SMTP port"
                >
                  <option value="587">587 — TLS</option>
                  <option value="465">465 — SSL</option>
                  <option value="25">25  — Plain</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="smtp-user">
                Username <span className="settings-required">*</span>
              </label>
              <input
                id="smtp-user"
                className="field__input"
                type="text"
                placeholder="you@gmail.com"
                value={form.smtp_username}
                onChange={set("smtp_username")}
                autoComplete="username"
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="smtp-pass">
                Password / App Password <span className="settings-required">*</span>
              </label>
              <input
                id="smtp-pass"
                className="field__input settings-secret"
                type="password"
                placeholder="••••••••••••••••"
                value={form.smtp_password}
                onChange={set("smtp_password")}
                autoComplete="new-password"
              />
              <div className="field__hint">
                For Gmail, generate an{" "}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="settings-link"
                >
                  App Password ↗
                </a>
                {" "}(requires 2FA enabled).
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Feedback messages ── */}
      {saveMsg && (
        <div className={`settings-msg settings-msg--${saveMsg.type}`} role="alert">
          <span className="settings-msg__icon">{saveMsg.type === "success" ? "✓" : "⚠"}</span>
          {saveMsg.text}
        </div>
      )}

      {testMsg && (
        <div className={`settings-msg settings-msg--${testMsg.type}`} role="status">
          <span className="settings-msg__icon">{testMsg.type === "success" ? "✓" : "⚠"}</span>
          {testMsg.text}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="action-bar" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
        <button
          className="btn btn--secondary"
          onClick={handleTest}
          disabled={testing || saving}
          aria-label="Test sender connection"
        >
          {testing ? <><span className="settings-spin" />Testing…</> : "Test Connection"}
        </button>
        <button
          className="btn btn--primary"
          onClick={handleSave}
          disabled={saving || testing}
          aria-label="Save sender profile"
        >
          {saving ? <><span className="settings-spin" />Saving…</> : "Save Profile"}
        </button>
      </div>

      {/* ── Info box ── */}
      <div className="settings-info">
        <div className="settings-info__icon">🔒</div>
        <div className="settings-info__text">
          Credentials are stored securely in your Supabase database.
          AES-256-GCM encryption will be added in a future release.
        </div>
      </div>
    </div>
  );
}

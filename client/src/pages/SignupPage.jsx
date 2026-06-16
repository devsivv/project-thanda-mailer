import { useState } from "react";
import { useAuth } from "../context/useAuth";

export default function SignupPage({ onSwitchToLogin }) {
  const { signUp } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim())        { setError("Email is required."); return; }
    if (!password)            { setError("Password is required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const data = await signUp(email.trim(), password);

      // If session is returned immediately, AuthContext will redirect.
      // If email confirmation is required, show a success message instead.
      if (!data.session) {
        setSuccess(true);
      }
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-brand__logo">✉</div>
            <div className="auth-brand__name">Thanda Mail</div>
          </div>
          <div className="auth-success-state">
            <div className="auth-success-state__icon">📬</div>
            <h2 className="auth-success-state__title">Check your inbox</h2>
            <p className="auth-success-state__desc">
              We sent a confirmation link to <strong>{email}</strong>.
              Click it to activate your account.
            </p>
            <button className="auth-switch__link" onClick={onSwitchToLogin}>
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand__logo">✉</div>
          <div className="auth-brand__name">Thanda Mail</div>
          <div className="auth-brand__tagline">Cold outreach. Delivered reliably.</div>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start sending cold emails in minutes</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-error" role="alert">
              <span className="auth-error__icon">⚠</span>
              {error}
            </div>
          )}

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              className="auth-field__input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              className="auth-field__input"
              type="password"
              autoComplete="new-password"
              placeholder="min 6 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="signup-confirm">Confirm password</label>
            <input
              id="signup-confirm"
              className="auth-field__input"
              type="password"
              autoComplete="new-password"
              placeholder="repeat password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(""); }}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
            aria-label="Create account"
          >
            {loading ? <span className="auth-spinner" /> : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <button className="auth-switch__link" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

function friendlyError(msg = "") {
  if (msg.includes("User already registered"))         return "An account with this email already exists. Try signing in.";
  if (msg.includes("Password should be at least"))     return "Password must be at least 6 characters.";
  if (msg.includes("Unable to validate email address")) return "Please enter a valid email address.";
  if (msg.includes("Too many requests"))               return "Too many attempts. Please wait a moment.";
  return msg || "Signup failed. Please try again.";
}

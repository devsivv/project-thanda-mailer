import { useState } from "react";
import { useAuth } from "../context/useAuth";


export default function LoginPage({ onSwitchToSignup }) {
  const { signIn } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim())    { setError("Email is required."); return; }
    if (!password)        { setError("Password is required."); return; }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // AuthContext updates user → App.jsx re-renders to main app
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand__logo">✉</div>
          <div className="auth-brand__name">Thanda Mail</div>
          <div className="auth-brand__tagline">Cold outreach. Delivered reliably.</div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-error" role="alert">
              <span className="auth-error__icon">⚠</span>
              {error}
            </div>
          )}

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
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
            <label className="auth-field__label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="auth-field__input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
            aria-label="Sign in"
          >
            {loading ? <span className="auth-spinner" /> : "Sign In"}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account?{" "}
          <button className="auth-switch__link" onClick={onSwitchToSignup}>
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}

// ── Map Supabase error messages to user-friendly strings ─────────────────────
function friendlyError(msg = "") {
  if (msg.includes("Invalid login credentials"))  return "Incorrect email or password.";
  if (msg.includes("Email not confirmed"))         return "Please confirm your email first. Check your inbox.";
  if (msg.includes("Too many requests"))           return "Too many attempts. Please wait a moment.";
  if (msg.includes("User not found"))              return "No account found with this email.";
  return msg || "Sign in failed. Please try again.";
}

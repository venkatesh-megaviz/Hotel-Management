import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Shield } from "lucide-react";
import { useAuth, ApiError } from "@/context/AuthContext";
import "./SuperAdmin.css";

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const { loginAsSuperAdmin, isAuthenticated, isSuperAdmin, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoading && isAuthenticated && isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (!isLoading && isAuthenticated && !isSuperAdmin) {
    return <Navigate to="/app" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter email and password");
      return;
    }

    setSubmitting(true);
    try {
      await loginAsSuperAdmin(email.trim(), password);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sa-login-page">
      <div className="sa-login-card">
        <div className="sa-login-brand">
          <span className="sa-badge">★ Super Admin</span>
        </div>

        <div className="sa-login-head">
          <span className="sa-login-icon">
            <Shield size={20} strokeWidth={2} />
          </span>
          <h1>Platform sign in</h1>
          <p>Access the Dinevoro Super Admin console</p>
        </div>

        {error && (
          <p className="sa-login-error">
            <AlertCircle size={14} /> {error}
          </p>
        )}

        <form className="sa-login-form" onSubmit={handleSubmit}>
          <label>
            Email Address
            <input
              type="email"
              required
              autoComplete="username"
              placeholder="admin@dinevoro.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            Password
            <div className="sa-login-password">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <button type="submit" className="sa-btn is-primary is-block" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in to Super Admin"}
          </button>
        </form>

        <p className="sa-login-hint">
          Restaurant owners?{" "}
          <Link to="/login">Use restaurant login</Link>
        </p>
      </div>
    </div>
  );
}

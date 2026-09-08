import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { PasswordField } from "../components/auth/PasswordField";
import { useAuth } from "../context/AuthContext";

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email, password);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Choose a new password for your PingMe account."
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm text-secondary">
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-ink outline-none transition focus:border-accent hover:border-line-hover"
          />
        </label>
        <PasswordField
          label="New password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={6}
          required
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={6}
          required
          autoComplete="new-password"
        />
        {error && (
          <p className="rounded-xl bg-failed/10 px-3 py-2 text-sm text-failed">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-accent py-2.5 font-medium text-white transition hover:bg-accent-hover hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
        >
          {submitting ? "Updating..." : "Update password"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-quiet">
        <Link to="/login" className="font-medium text-accent transition hover:underline">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}

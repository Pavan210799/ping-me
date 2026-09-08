import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { useAuth } from "../context/AuthContext";

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const matchedEmail = await requestPasswordReset(email);
      navigate(`/reset-password?email=${encodeURIComponent(matchedEmail)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not find that account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter the email on your account and we will take you to reset it."
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
        {error && (
          <p className="rounded-xl bg-failed/10 px-3 py-2 text-sm text-failed">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-accent py-2.5 font-medium text-white transition hover:bg-accent-hover hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
        >
          {submitting ? "Checking..." : "Continue"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-quiet">
        Remembered it?{" "}
        <Link to="/login" className="font-medium text-accent transition hover:underline">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}

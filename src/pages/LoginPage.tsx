import { Link, useNavigate } from "react-router-dom";
import { FormEvent, useState } from "react";
import { AuthLayout } from "../components/auth/AuthLayout";
import { PasswordField } from "../components/auth/PasswordField";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue your conversations.">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm text-secondary">
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            placeholder="Enter your email"
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-ink outline-none transition focus:border-accent"
          />
        </label>
        <PasswordField
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs font-semibold text-accent transition hover:text-accent-hover">
            Forgot password?
          </Link>
        </div>
        {error && (
          <p className="rounded-xl bg-failed/10 px-3 py-2 text-sm text-failed">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-accent py-2.5 font-medium text-white transition hover:bg-accent-hover hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-quiet">
        New here?{" "}
        <Link to="/signup" className="font-medium text-accent transition hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}

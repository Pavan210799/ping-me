import { Link, useNavigate } from "react-router-dom";
import { FormEvent, useState } from "react";
import { AuthLayout } from "../components/auth/AuthLayout";
import { PasswordField } from "../components/auth/PasswordField";
import { useAuth } from "../context/AuthContext";

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signup(name, email, password);
      navigate("/signup-success", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Join PingMe and start a conversation.">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm text-secondary">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="Enter your name"
            autoComplete="name"
            className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-ink outline-none transition focus:border-accent"
          />
        </label>
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
          minLength={6}
          required
          placeholder="Create a password (6+ characters)"
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
          {submitting ? "Creating..." : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-quiet">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-accent transition hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

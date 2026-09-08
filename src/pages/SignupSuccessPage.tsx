import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { useAuth } from "../context/AuthContext";

export function SignupSuccessPage() {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <AuthLayout
      title={`Welcome, ${firstName}`}
      subtitle={`Your PingMe account is ready. Conversations stay saved to ${user?.email ?? "your email"}.`}
      hero={
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          <span className="animate-success-ring absolute inset-0 rounded-full border-2 border-accent/50" />
          <span className="animate-success-ring absolute inset-0 rounded-full border border-accent/30 [animation-delay:0.45s]" />
          <span className="animate-success-glow absolute inset-3 rounded-full bg-accent/15" />
          <span className="relative z-10 grid h-16 w-16 place-items-center rounded-full bg-accent text-white shadow-[0_12px_28px_-12px_rgba(217,93,57,0.7)]">
            <CheckCircle2 size={34} strokeWidth={1.8} className="animate-pop-in" />
          </span>
          <span className="animate-success-spark absolute -right-1 top-2 h-2 w-2 rounded-full bg-accent" />
          <span className="animate-success-spark absolute -left-2 top-8 h-1.5 w-1.5 rounded-full bg-accent [animation-delay:0.35s]" />
          <span className="animate-success-spark absolute bottom-1 right-0 h-1.5 w-1.5 rounded-full bg-accent [animation-delay:0.7s]" />
        </div>
      }
    >
      <Link
        to="/"
        className="block w-full rounded-xl bg-accent py-2.5 text-center font-medium text-white transition hover:bg-accent-hover hover:scale-[1.01] active:scale-[0.99]"
      >
        Start chatting
      </Link>
    </AuthLayout>
  );
}

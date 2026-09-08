import type { ReactNode } from "react";
import { Logo } from "../Logo";
import { ThemeToggle } from "../ThemeToggle";
import { AuthBackground } from "./AuthBackground";

export function AuthLayout({
  title,
  subtitle,
  hero,
  children,
}: {
  title: string;
  subtitle: string;
  hero?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-page">
      <AuthBackground />
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="animate-logo-float">
            <Logo size={84} />
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-ink">PingMe</h1>
          <p className="mt-1 text-sm text-quiet">Warm, fast, real-time chat.</p>
        </div>
        <div className="animate-fade-in rounded-3xl border border-line bg-surface/80 p-6 shadow-[0_20px_50px_-24px_rgba(41,35,31,0.45)] backdrop-blur-xl">
          {hero}
          <h2 className={`${hero ? "mt-5 text-center" : ""} text-xl font-semibold text-ink`}>{title}</h2>
          <p className={`mt-1 mb-5 text-sm text-quiet ${hero ? "text-center" : ""}`}>{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

import { useTheme } from "../../context/ThemeContext";

export function AuthBackground() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          dark
            ? "bg-[radial-gradient(circle_at_12%_18%,rgba(224,112,80,0.32),transparent_38%),radial-gradient(circle_at_88%_12%,rgba(234,222,207,0.08),transparent_32%),radial-gradient(circle_at_50%_100%,#14110f,#1c1916)]"
            : "bg-[radial-gradient(circle_at_12%_18%,rgba(217,93,57,0.32),transparent_36%),radial-gradient(circle_at_88%_12%,rgba(234,222,207,0.7),transparent_30%),radial-gradient(circle_at_50%_100%,#f3eee7,#fffdf9)]"
        }`}
      />
      <div className="auth-grid absolute inset-0 opacity-50" />
      <div className="animate-auth-orb-a absolute -left-24 top-10 h-80 w-80 rounded-full bg-accent/35 blur-3xl" />
      <div className="animate-auth-orb-b absolute -right-16 top-32 h-96 w-96 rounded-full bg-hover/80 blur-3xl" />
      <div className="animate-auth-orb-c absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent/28 blur-3xl" />
      <div className="animate-auth-spin absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full border border-accent/25" />
      <div className="animate-auth-spin-reverse absolute left-[10%] top-[52%] h-44 w-44 rounded-full border border-dashed border-accent/30" />
      <div className="animate-auth-spin absolute right-[8%] bottom-[18%] h-28 w-28 rounded-full border border-accent/20" />
      {["left-[18%] top-[22%]", "right-[16%] top-[30%]", "left-[28%] bottom-[18%]", "right-[24%] bottom-[28%]"].map(
        (place, index) => (
          <span
            key={place}
            className={`animate-auth-bubble absolute ${place} text-accent/45`}
            style={{ animationDelay: `${index * 0.8}s` }}
          >
            <svg width={index % 2 === 0 ? 42 : 28} height={index % 2 === 0 ? 42 : 28} viewBox="0 0 32 32" fill="currentColor">
              <path d="M6 8.2c0-2.3 1.9-4.2 4.2-4.2h11.4c2.3 0 4.2 1.9 4.2 4.2v8.2c0 2.3-1.9 4.2-4.2 4.2h-6.1L8.4 25V20.6H10.2C8 20.6 6 18.6 6 16.4V8.2Z" />
            </svg>
          </span>
        ),
      )}
      {Array.from({ length: 22 }).map((_, index) => (
        <span
          key={index}
          className="animate-auth-twinkle absolute h-1.5 w-1.5 rounded-full bg-accent"
          style={{
            left: `${(index * 17) % 100}%`,
            top: `${(index * 13) % 90}%`,
            animationDelay: `${index * 0.16}s`,
          }}
        />
      ))}
    </div>
  );
}

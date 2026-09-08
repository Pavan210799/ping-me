import type { CSSProperties } from "react";

function ChatBubble({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 32 32" fill="currentColor" aria-hidden>
      <path d="M6 8.2c0-2.3 1.9-4.2 4.2-4.2h11.4c2.3 0 4.2 1.9 4.2 4.2v8.2c0 2.3-1.9 4.2-4.2 4.2h-6.1L8.4 25V20.6H10.2C8 20.6 6 18.6 6 16.4V8.2Z" />
    </svg>
  );
}

function PaperPlane({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 32 32" fill="currentColor" aria-hidden>
      <path d="M5.2 14.6 27 6.4c.9-.3 1.7.6 1.3 1.5L19.8 27c-.3.8-1.5.8-1.8 0l-3.4-8.3-8.4-2.3c-.9-.2-.9-1.5 0-1.8Z" />
    </svg>
  );
}

export function ChatBackground() {
  return (
    <div className="chat-scene pointer-events-none absolute inset-0 overflow-hidden">
      <div className="chat-wave absolute inset-0" />
      <span
        className="animate-chat-rise absolute left-[12%] bottom-[-10%] h-16 w-16 rounded-[40%_60%_55%_45%] border-2 border-accent/25"
        style={{ animationDelay: "-4s" }}
      />
      <span
        className="animate-chat-rise-slow absolute left-[48%] bottom-[-18%] h-10 w-10 rounded-full bg-accent/15"
        style={{ animationDelay: "-11s" }}
      />
      <span
        className="animate-chat-rise-delay absolute right-[18%] bottom-[-12%] h-14 w-20 rounded-[45%_55%_50%_50%] border-2 border-accent/20"
        style={{ animationDelay: "-7s" }}
      />
      <span
        className="animate-chat-rise absolute right-[38%] bottom-[-20%] h-8 w-8 rounded-full border border-accent/30"
        style={{ animationDelay: "-13s" }}
      />
      <span
        className="animate-chat-rise-late absolute left-[32%] bottom-[-16%] h-12 w-12 rounded-full border-2 border-dashed border-accent/25"
        style={{ animationDelay: "-9s" }}
      />
      <span
        className="animate-chat-rise-slow absolute right-[8%] bottom-[-22%] h-6 w-16 rounded-full bg-accent/12"
        style={{ animationDelay: "-3s" }}
      />
      <span
        className="animate-chat-rise-delay absolute left-[68%] bottom-[-8%] h-5 w-5 rounded-full bg-accent/20"
        style={{ animationDelay: "-15s" }}
      />
      <ChatBubble
        className="animate-chat-rise absolute left-[22%] bottom-[-14%] h-11 w-11 text-accent/30"
        style={{ animationDelay: "-6s" }}
      />
      <ChatBubble
        className="animate-chat-rise-late absolute right-[28%] bottom-[-18%] h-8 w-8 text-accent/25"
        style={{ animationDelay: "-12s" }}
      />
      <PaperPlane
        className="animate-chat-rise-slow absolute left-[58%] bottom-[-12%] h-10 w-10 rotate-12 text-accent/30"
        style={{ animationDelay: "-8s" }}
      />
      <PaperPlane
        className="animate-chat-rise-delay absolute left-[6%] bottom-[-20%] h-7 w-7 -rotate-6 text-accent/22"
        style={{ animationDelay: "-2s" }}
      />
      <div
        className="animate-chat-sheen absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent dark:via-white/5"
        style={{ animationDelay: "-3s" }}
      />
    </div>
  );
}

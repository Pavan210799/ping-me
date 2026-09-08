import type { CSSProperties, SVGProps } from "react";

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "🎉"];

type IconProps = SVGProps<SVGSVGElement> & { cutout?: string };

function ThumbIcon({ cutout: _cutout, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M14.4 8.2V5.1c0-1.4-1.1-2.6-2.5-2.6-.5 0-.9.3-1.1.7L8.2 8.9H5.4c-1.3 0-2.4 1.1-2.4 2.4v7.2c0 1.3 1.1 2.4 2.4 2.4h8.8c1.1 0 2-.7 2.3-1.8l1.7-5.7c.4-1.4-.6-2.8-2.1-2.8h-1.7V8.2Z" />
      <path d="M8.2 8.9v11.9H6.6c-.5 0-.9-.4-.9-.9V10c0-.6.4-1.1.9-1.1h1.6Z" opacity="0.35" />
    </svg>
  );
}

function HeartIcon({ cutout: _cutout, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 20.3s-6.8-4.2-8.5-8.1C2.2 9.2 3.4 6 6.4 5.4c1.8-.4 3.3.5 4.1 1.8.8-1.3 2.3-2.2 4.1-1.8 3 .6 4.2 3.8 2.9 6.8-1.7 3.9-8.5 8.1-8.5 8.1Z" />
    </svg>
  );
}

function LaughIcon({ cutout = "var(--bubble-received)", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" />
      <path
        d="M8.2 10.2c.6 0 1.1-.6 1.1-1.2S8.8 7.8 8.2 7.8 7.1 8.4 7.1 9s.5 1.2 1.1 1.2Zm7.6 0c.6 0 1.1-.6 1.1-1.2s-.5-1.2-1.1-1.2-1.1.6-1.1 1.2.5 1.2 1.1 1.2ZM7.8 13.2c.8 2.3 2.3 3.5 4.2 3.5s3.4-1.2 4.2-3.5H7.8Z"
        fill={cutout}
      />
    </svg>
  );
}

function WowIcon({ cutout = "var(--bubble-received)", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="1.15" fill={cutout} />
      <circle cx="15" cy="10" r="1.15" fill={cutout} />
      <ellipse cx="12" cy="15.2" rx="1.5" ry="2.1" fill={cutout} />
    </svg>
  );
}

function PartyIcon({ cutout: _cutout, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M7.2 20.4 3.6 16.8c-.5-.5-.3-1.4.4-1.7l7.2-2.6-2.6 7.2c-.3.7-1.2.9-1.4.7Z" />
      <path d="M14.2 4.2c.4-.7 1.4-.7 1.8 0l.7 1.3 1.5.3c.8.1 1.1 1.1.5 1.6l-1.1.9.2 1.5c.1.8-.7 1.3-1.4 1l-1.3-.6-1.3.6c-.7.3-1.5-.2-1.4-1l.2-1.5-1.1-.9c-.6-.5-.3-1.5.5-1.6l1.5-.3.7-1.3Z" />
      <path d="M18.8 11.4h1.6v1.6h-1.6zm-2.4 3.2h1.4v1.4h-1.4zm3.6 1.6h1.2v1.2h-1.2z" />
    </svg>
  );
}

export function ThemeEmoji({
  emoji,
  className = "",
  style,
  size = 16,
  onSent = false,
}: {
  emoji: string;
  className?: string;
  style?: CSSProperties;
  size?: number;
  onSent?: boolean;
}) {
  const cutout = onSent ? "var(--bubble-sent)" : "var(--bubble-received)";
  const iconProps = { width: size, height: size, className, style, cutout };

  if (emoji === "👍") {
    return <ThumbIcon {...iconProps} />;
  }
  if (emoji === "❤️") {
    return <HeartIcon {...iconProps} />;
  }
  if (emoji === "😂") {
    return <LaughIcon {...iconProps} />;
  }
  if (emoji === "😮") {
    return <WowIcon {...iconProps} />;
  }
  if (emoji === "🎉") {
    return <PartyIcon {...iconProps} />;
  }

  return (
    <span className={className} style={style}>
      {emoji}
    </span>
  );
}

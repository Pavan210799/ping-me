import type { CSSProperties, SVGProps } from "react";

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "🎉"];

type IconProps = SVGProps<SVGSVGElement>;

function ThumbIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#F5C518"
        d="M14.4 8.2V5.1c0-1.4-1.1-2.6-2.5-2.6-.5 0-.9.3-1.1.7L8.2 8.9H5.4c-1.3 0-2.4 1.1-2.4 2.4v7.2c0 1.3 1.1 2.4 2.4 2.4h8.8c1.1 0 2-.7 2.3-1.8l1.7-5.7c.4-1.4-.6-2.8-2.1-2.8h-1.7V8.2Z"
      />
      <path fill="#E0A800" d="M8.2 8.9v11.9H6.6c-.5 0-.9-.4-.9-.9V10c0-.6.4-1.1.9-1.1h1.6Z" />
    </svg>
  );
}

function HeartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#FF2D55"
        d="M12 20.3s-6.8-4.2-8.5-8.1C2.2 9.2 3.4 6 6.4 5.4c1.8-.4 3.3.5 4.1 1.8.8-1.3 2.3-2.2 4.1-1.8 3 .6 4.2 3.8 2.9 6.8-1.7 3.9-8.5 8.1-8.5 8.1Z"
      />
    </svg>
  );
}

function LaughIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" fill="#FFCC4D" />
      <circle cx="8.2" cy="9.2" r="1.15" fill="#664E27" />
      <circle cx="15.8" cy="9.2" r="1.15" fill="#664E27" />
      <path fill="#664E27" d="M7.6 13.1c.9 2.5 2.5 3.8 4.4 3.8s3.5-1.3 4.4-3.8H7.6Z" />
      <path fill="#FFCC4D" d="M9.2 13.1h5.6c-.5 1.4-1.5 2.2-2.8 2.2s-2.3-.8-2.8-2.2Z" />
    </svg>
  );
}

function WowIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" fill="#FFCC4D" />
      <circle cx="9" cy="10" r="1.2" fill="#664E27" />
      <circle cx="15" cy="10" r="1.2" fill="#664E27" />
      <ellipse cx="12" cy="15.3" rx="1.55" ry="2.15" fill="#664E27" />
    </svg>
  );
}

function PartyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path fill="#FF6B81" d="M7.2 20.4 3.6 16.8c-.5-.5-.3-1.4.4-1.7l7.2-2.6-2.6 7.2c-.3.7-1.2.9-1.4.7Z" />
      <path
        fill="#FFD54A"
        d="M14.2 4.2c.4-.7 1.4-.7 1.8 0l.7 1.3 1.5.3c.8.1 1.1 1.1.5 1.6l-1.1.9.2 1.5c.1.8-.7 1.3-1.4 1l-1.3-.6-1.3.6c-.7.3-1.5-.2-1.4-1l.2-1.5-1.1-.9c-.6-.5-.3-1.5.5-1.6l1.5-.3.7-1.3Z"
      />
      <path fill="#7C5CFF" d="M18.8 11.4h1.6v1.6h-1.6z" />
      <path fill="#31C48D" d="M16.4 14.6h1.4v1.4h-1.4z" />
      <path fill="#FF8A3D" d="M20 16.2h1.2v1.2H20z" />
    </svg>
  );
}

export function ThemeEmoji({
  emoji,
  className = "",
  style,
  size = 16,
}: {
  emoji: string;
  className?: string;
  style?: CSSProperties;
  size?: number;
  onSent?: boolean;
}) {
  const iconProps = { width: size, height: size, className, style };

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

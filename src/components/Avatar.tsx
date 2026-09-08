import { Users } from "lucide-react";
import { getInitials } from "../lib/format";

const AVATAR_COLOR = "#d95d39";

type AvatarProps = {
  name: string;
  color?: string;
  size?: number;
  online?: boolean;
  showStatus?: boolean;
  group?: boolean;
};

export function Avatar({
  name,
  size = 40,
  online,
  showStatus = false,
  group = false,
}: AvatarProps) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full text-white font-semibold transition duration-200 hover:scale-105"
        style={{ background: AVATAR_COLOR, fontSize: size * 0.32 }}
      >
        {group ? <Users size={Math.round(size * 0.48)} strokeWidth={2.2} /> : getInitials(name)}
      </div>
      {showStatus && (
        <span
          className={`absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-surface ${
            online ? "bg-online" : "bg-offline"
          }`}
        />
      )}
    </div>
  );
}

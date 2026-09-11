import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../context/ChatContext";
import { getInitials } from "../lib/format";
import { mediaUrl } from "../lib/backend";
import { Users } from "lucide-react";

const AVATAR_COLOR = "#d95d39";

type AvatarProps = {
  name: string;
  color?: string;
  size?: number;
  online?: boolean;
  showStatus?: boolean;
  group?: boolean;
  imageUrl?: string;
  userId?: string;
};

export function Avatar({
  name,
  size = 40,
  online,
  showStatus = false,
  group = false,
  imageUrl,
  userId,
}: AvatarProps) {
  const chat = useContext(ChatContext);
  const person = userId && chat?.usersById[userId] ? chat.usersById[userId] : undefined;
  const src = person?.avatarUrl || imageUrl || "";
  const label = person?.name || name;
  const [failed, setFailed] = useState(false);

  useEffect(
    function () {
      setFailed(false);
    },
    [src],
  );

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-full text-white font-semibold transition duration-200 hover:scale-105"
        style={{ background: AVATAR_COLOR, fontSize: size * 0.32 }}
      >
        {src && !failed ? (
          <img
            key={src}
            src={mediaUrl(src)}
            alt={label}
            className="h-full w-full object-cover"
            onError={function () {
              setFailed(true);
            }}
          />
        ) : group ? (
          <Users size={Math.round(size * 0.48)} strokeWidth={2.2} />
        ) : (
          getInitials(label)
        )}
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

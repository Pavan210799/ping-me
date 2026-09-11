import { useChat } from "../../context/ChatContext";
import { Avatar } from "../Avatar";

export function TypingBubble({ userId }: { userId: string }) {
  const { usersById } = useChat();
  const person = usersById[userId];
  const name = person?.name ?? "Someone";

  return (
    <div className="flex justify-start gap-2 animate-message-in">
      <div className="mt-auto">
        <Avatar name={name} color={person?.avatarColor ?? "#9a9087"} imageUrl={person?.avatarUrl} userId={userId} size={28} />
      </div>
      <div className="flex max-w-[80%] flex-col items-start md:max-w-[65%]">
        <p className="mb-1 px-1 text-xs text-quiet">{name}</p>
        <div className="rounded-2xl rounded-bl-md bg-bubble-received/90 px-3 py-2 text-ink shadow-sm backdrop-blur-sm">
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-quiet" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-quiet [animation-delay:150ms]" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-quiet [animation-delay:300ms]" />
            </span>
            <span className="text-sm text-quiet">typing...</span>
          </span>
        </div>
      </div>
    </div>
  );
}

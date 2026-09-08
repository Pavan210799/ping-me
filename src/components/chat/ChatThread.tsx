import { ArrowLeft, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { useDebounce } from "../../hooks/useDebounce";
import { chatTitle, formatLastSeen, formatTime } from "../../lib/format";
import { Avatar } from "../Avatar";
import { Composer } from "./Composer";
import { ChatBackground } from "./ChatBackground";
import { MessageList } from "./MessageList";

export function ChatThread({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const {
    activeChat,
    usersById,
    typingUserIds,
    searchInChat,
    searchResults,
    searching,
  } = useChat();
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [, setLastSeenTick] = useState(0);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLastSeenTick((tick) => tick + 1);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!showSearch) {
      return;
    }
    void searchInChat(debouncedQuery);
  }, [debouncedQuery, showSearch]);

  if (!user || !activeChat) {
    return null;
  }

  const title = chatTitle(activeChat.name, activeChat.memberIds, user.id, usersById);
  const otherId = activeChat.memberIds.find((id) => id !== user.id);
  const other = otherId ? usersById[otherId] : undefined;
  const typingNames = typingUserIds
    .map((id) => usersById[id]?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <section className="chat-wallpaper relative flex h-full min-w-0 flex-1 flex-col">
      <ChatBackground />
      <header className="relative z-10 flex items-center gap-3 border-b border-line bg-surface/80 px-3 py-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl p-2 transition hover:bg-hover hover:scale-110 md:hidden"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <Avatar
          name={title}
          group={activeChat.type === "group"}
          online={activeChat.type === "direct" ? other?.online : undefined}
          showStatus={activeChat.type === "direct"}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{title}</p>
          <p className="text-xs text-quiet">
            {activeChat.type === "group"
              ? typingNames
                ? `${typingNames} typing...`
                : `${activeChat.memberIds.length} members`
              : typingNames
                ? "typing..."
                : other?.online
                  ? "Online"
                  : other?.lastSeen
                    ? `Last seen ${formatLastSeen(other.lastSeen)}`
                    : "Offline"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowSearch((open) => !open)}
          className="rounded-xl p-2 text-quiet transition hover:bg-hover hover:text-ink hover:scale-110"
          aria-label="Search messages"
        >
          {showSearch ? <X size={18} /> : <Search size={18} />}
        </button>
      </header>

      {showSearch && (
        <div className="relative z-10 border-b border-line bg-surface/90 px-3 py-2 backdrop-blur-xl">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search in conversation"
            className="w-full rounded-xl border border-line bg-muted px-3 py-2 text-sm outline-none transition focus:border-accent"
          />
          <div className="max-h-40 overflow-y-auto">
            {searching && <p className="px-1 py-2 text-xs text-quiet">Searching...</p>}
            {!searching && debouncedQuery && searchResults.length === 0 && (
              <p className="px-1 py-2 text-xs text-quiet">No messages found.</p>
            )}
            {searchResults.map((message) => (
              <button
                type="button"
                key={message.id}
                onClick={() => {
                  setShowSearch(false);
                  setQuery("");
                }}
                className="block w-full truncate rounded-lg px-2 py-2 text-left text-sm transition hover:bg-hover"
              >
                <span className="mr-2 text-xs text-subtle">{formatTime(message.createdAt)}</span>
                {message.text}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-0 flex-1">
        <MessageList />
      </div>

      {typingNames && (
        <div className="relative z-10 flex items-center gap-2 px-5 pb-1 text-xs text-accent">
          <span className="flex gap-1">
            <span className="typing-dot h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="typing-dot h-1.5 w-1.5 rounded-full bg-accent [animation-delay:150ms]" />
            <span className="typing-dot h-1.5 w-1.5 rounded-full bg-accent [animation-delay:300ms]" />
          </span>
          {typingNames} typing...
        </div>
      )}

      <div className="relative z-10">
        <Composer />
      </div>
    </section>
  );
}

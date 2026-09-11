import { LogOut, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { useDebounce } from "../../hooks/useDebounce";
import { chatTitle, formatLastSeen, formatTime } from "../../lib/format";
import type { User } from "../../types";
import { Avatar } from "../Avatar";
import { Logo } from "../Logo";
import { ThemeToggle } from "../ThemeToggle";

export function Sidebar({
  onNewChat,
  onOpenProfile,
}: {
  onNewChat: () => void;
  onOpenProfile: () => void;
}) {
  const { user, logout } = useAuth();
  const {
    chats,
    users,
    usersById,
    activeChatId,
    pingChatId,
    pingKey,
    selectChat,
    startDirectChat,
    loadingChats,
    connectionStatus,
    globalSearchResults,
    searchingGlobal,
    searchAllChats,
    revealMessage,
  } = useChat();
  const [query, setQuery] = useState("");
  const [openingPerson, setOpeningPerson] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const needle = query.trim().toLowerCase();
  const searching = needle.length > 0;

  useEffect(() => {
    void searchAllChats(debouncedQuery);
  }, [debouncedQuery]);

  const matchingPeople: User[] = [];
  if (needle) {
    for (let i = 0; i < users.length; i += 1) {
      const person = users[i];
      const nameMatch = person.name.toLowerCase().includes(needle);
      const emailMatch = person.email.toLowerCase().includes(needle);
      if (nameMatch || emailMatch) {
        matchingPeople.push(person);
      }
    }
  }

  if (!user) {
    return null;
  }

  async function openPerson(userId: string) {
    setOpeningPerson(true);
    try {
      await startDirectChat(userId);
      setQuery("");
    } finally {
      setOpeningPerson(false);
    }
  }

  return (
    <aside className="relative flex h-full w-full flex-col overflow-hidden border-r border-line bg-surface/80 backdrop-blur-xl md:w-80">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,color-mix(in_srgb,var(--accent)_16%,transparent),transparent_55%)]" />
      <div className="relative z-10 flex items-center gap-3 px-4 py-4">
        <Logo size={40} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-none">PingMe</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-quiet">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connectionStatus === "connected" ? "bg-online" : "bg-offline"
              }`}
            />
            {connectionStatus === "connected" ? "Live" : "Reconnecting..."}
          </p>
        </div>
        <ThemeToggle />
        <button
          type="button"
          onClick={onNewChat}
          className="rounded-xl bg-accent p-2 text-white transition hover:bg-accent-hover hover:scale-110 hover:rotate-90"
          aria-label="New chat"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="relative z-10 px-4 pb-3">
        <label className="flex items-center gap-2 rounded-xl border border-line bg-muted px-3 py-2 text-quiet transition focus-within:border-accent">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people and messages"
            className="w-full bg-transparent text-sm text-ink outline-none"
          />
        </label>
      </div>

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-2">
        {loadingChats && (
          <div className="space-y-2 p-2">
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
          </div>
        )}

        {!loadingChats && searching && (
          <>
            <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-quiet uppercase">
              People
            </p>
            {matchingPeople.length === 0 && (
              <p className="px-3 py-3 text-sm text-quiet">No people match.</p>
            )}
            {matchingPeople.map((person) => (
              <button
                type="button"
                key={person.id}
                disabled={openingPerson}
                onClick={() => void openPerson(person.id)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-hover"
              >
                <Avatar
                  name={person.name}
                  color={person.avatarColor}
                  imageUrl={person.avatarUrl}
                  userId={person.id}
                  online={person.online}
                  showStatus
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{person.name}</span>
                  <span className="block truncate text-xs text-quiet">
                    {person.online
                      ? "Online"
                      : person.lastSeen
                        ? `Last seen ${formatLastSeen(person.lastSeen)}`
                        : "Offline"}
                  </span>
                </span>
              </button>
            ))}

            <p className="px-3 pt-4 pb-1 text-[11px] font-semibold tracking-wide text-quiet uppercase">
              Messages
            </p>
            {(query.trim() !== debouncedQuery.trim() || searchingGlobal) && (
              <p className="px-3 py-3 text-sm text-quiet">Searching messages...</p>
            )}
            {query.trim() === debouncedQuery.trim() &&
              !searchingGlobal &&
              globalSearchResults.length === 0 && (
              <p className="px-3 py-3 text-sm text-quiet">No messages match.</p>
            )}
            {query.trim() === debouncedQuery.trim() &&
              !searchingGlobal &&
              globalSearchResults.map((message) => {
                const chat = chats.find((item) => item.id === message.chatId);
                const title = chat
                  ? chatTitle(chat.name, chat.memberIds, user.id, usersById)
                  : "Chat";
                return (
                  <button
                    type="button"
                    key={message.id}
                    onClick={() => {
                      void revealMessage(message.chatId, message.id);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-hover"
                  >
                    <Avatar
                      name={title}
                      group={chat?.type === "group"}
                      imageUrl={
                        chat?.type === "direct"
                          ? usersById[chat.memberIds.find((id) => id !== user.id) || ""]?.avatarUrl
                          : undefined
                      }
                      userId={
                        chat?.type === "direct"
                          ? chat.memberIds.find((id) => id !== user.id)
                          : undefined
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{title}</span>
                      <span className="block truncate text-[11px] text-quiet">{message.text}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-subtle">
                      {formatTime(message.createdAt)}
                    </span>
                  </button>
                );
              })}
          </>
        )}

        {!loadingChats && !searching && chats.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-quiet">
            No conversations yet. Start one with the + button.
          </p>
        )}
        {!loadingChats &&
          !searching &&
          chats.map((chat, index) => {
            const title = chatTitle(chat.name, chat.memberIds, user.id, usersById);
            const otherId = chat.memberIds.find((id) => id !== user.id);
            const other = otherId ? usersById[otherId] : undefined;
            const selected = chat.id === activeChatId;
            const notifying = chat.id === pingChatId;
            return (
              <button
                type="button"
                key={chat.id}
                onClick={() => void selectChat(chat.id)}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left transition duration-200 ${
                  index > 0 ? "border-t border-line/70" : ""
                } ${selected ? "bg-soft" : "hover:bg-hover"} ${
                  notifying ? "animate-chat-notify" : ""
                }`}
              >
                <Avatar
                  name={title}
                  group={chat.type === "group"}
                  imageUrl={chat.type === "direct" ? other?.avatarUrl : undefined}
                  userId={chat.type === "direct" ? otherId : undefined}
                  online={chat.type === "direct" ? other?.online : undefined}
                  showStatus={chat.type === "direct"}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{title}</span>
                    {chat.lastMessage && (
                      <span className="text-[11px] text-subtle">
                        {formatTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] text-quiet">
                      {chat.lastMessage?.deletedAt
                        ? "Message deleted"
                        : chat.lastMessage?.text || "No messages yet"}
                    </span>
                    {chat.unreadCount > 0 && (
                      <span className="relative inline-flex">
                        {notifying && (
                          <span
                            key={pingKey}
                            className="animate-unread-ring absolute inset-0 rounded-full bg-accent"
                          />
                        )}
                        <span
                          className={`relative min-w-5 rounded-full bg-accent px-1.5 text-center text-[11px] text-white ${
                            notifying ? "animate-ig-react" : "animate-unread-pulse"
                          }`}
                        >
                          {chat.unreadCount}
                        </span>
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
      </div>

      <div className="relative z-10 px-3 pb-3 pt-2">
        <div className="flex items-center gap-1 rounded-2xl border border-line bg-card px-2 py-2 shadow-[0_10px_28px_color-mix(in_srgb,var(--accent)_16%,transparent)]">
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-0.5 text-left transition hover:bg-hover"
          >
            <Avatar name={user.name} color={user.avatarColor} imageUrl={user.avatarUrl} userId={user.id} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-xs text-quiet">{user.email}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl p-2 text-quiet transition hover:bg-hover hover:text-ink hover:scale-110"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

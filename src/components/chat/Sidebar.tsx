import { LogOut, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { chatTitle, formatTime } from "../../lib/format";
import { Avatar } from "../Avatar";
import { Logo } from "../Logo";
import { ThemeToggle } from "../ThemeToggle";
import { NewChatModal } from "./NewChatModal";

export function Sidebar() {
  const { user, logout } = useAuth();
  const { chats, usersById, activeChatId, selectChat, loadingChats, connectionStatus } =
    useChat();
  const [query, setQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle || !user) {
      return chats;
    }
    return chats.filter((chat) => {
      const title = chatTitle(chat.name, chat.memberIds, user.id, usersById).toLowerCase();
      const preview = chat.lastMessage?.text.toLowerCase() ?? "";
      return title.includes(needle) || preview.includes(needle);
    });
  }, [chats, query, user, usersById]);

  if (!user) {
    return null;
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
          onClick={() => setShowNewChat(true)}
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
            placeholder="Search chats"
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
        {!loadingChats && filtered.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-quiet">
            No conversations yet. Start one with the + button.
          </p>
        )}
        {filtered.map((chat, index) => {
          const title = chatTitle(chat.name, chat.memberIds, user.id, usersById);
          const otherId = chat.memberIds.find((id) => id !== user.id);
          const other = otherId ? usersById[otherId] : undefined;
          const selected = chat.id === activeChatId;
          return (
            <button
              type="button"
              key={chat.id}
              onClick={() => void selectChat(chat.id)}
              className={`flex w-full items-center gap-3 px-3 py-3 text-left transition duration-200 ${
                index > 0 ? "border-t border-line/70" : ""
              } ${selected ? "bg-soft" : "hover:bg-hover"}`}
            >
              <Avatar
                name={title}
                group={chat.type === "group"}
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
                  <span className="truncate text-sm text-quiet">
                    {chat.lastMessage?.deletedAt
                      ? "Message deleted"
                      : chat.lastMessage?.text || "No messages yet"}
                  </span>
                  {chat.unreadCount > 0 && (
                    <span className="min-w-5 rounded-full bg-accent px-1.5 text-center text-[11px] text-white animate-pop-in">
                      {chat.unreadCount}
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative z-10 flex items-center gap-3 border-t border-line px-4 py-3">
        <Avatar name={user.name} color={user.avatarColor} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="text-xs text-quiet">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-xl p-2 text-quiet transition hover:bg-hover hover:text-ink hover:scale-110"
          aria-label="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </aside>
  );
}

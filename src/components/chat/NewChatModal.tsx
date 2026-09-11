import { useState } from "react";
import { Search, X } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { formatLastSeen } from "../../lib/format";
import { Avatar } from "../Avatar";

export function NewChatModal({ onClose }: { onClose: () => void }) {
  const { users, startDirectChat, startGroupChat } = useChat();
  const [tab, setTab] = useState<"direct" | "group">("direct");
  const [query, setQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const needle = query.trim().toLowerCase();
  let filtered = users;
  if (needle) {
    filtered = [];
    for (let i = 0; i < users.length; i += 1) {
      const person = users[i];
      const nameMatch = person.name.toLowerCase().includes(needle);
      const emailMatch = person.email.toLowerCase().includes(needle);
      if (nameMatch || emailMatch) {
        filtered.push(person);
      }
    }
  }

  async function openDirect(userId: string) {
    setSaving(true);
    try {
      await startDirectChat(userId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start chat.");
    } finally {
      setSaving(false);
    }
  }

  async function createGroup() {
    setError("");
    setSaving(true);
    try {
      await startGroupChat(groupName, selected);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create group.");
    } finally {
      setSaving(false);
    }
  }

  function toggleMember(userId: string) {
    setSelected((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-line bg-surface/95 p-5 shadow-xl backdrop-blur-xl animate-pop-in"
        onClick={function (event) {
          event.stopPropagation();
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">New chat</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-hover">
            <X size={18} />
          </button>
        </div>
        <div className="mb-4 grid grid-cols-2 rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => setTab("direct")}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              tab === "direct" ? "bg-accent text-white" : "text-quiet hover:text-ink"
            }`}
          >
            Direct
          </button>
          <button
            type="button"
            onClick={() => setTab("group")}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              tab === "group" ? "bg-accent text-white" : "text-quiet hover:text-ink"
            }`}
          >
            Group
          </button>
        </div>

        {tab === "group" && (
          <input
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Group name"
            className="mb-3 w-full rounded-xl border border-line bg-card px-3 py-2 outline-none focus:border-accent"
          />
        )}

        <label className="mb-3 flex items-center gap-2 rounded-xl border border-line bg-muted px-3 py-2 text-quiet transition focus-within:border-accent">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people"
            className="w-full min-w-0 bg-transparent text-sm text-ink outline-none"
          />
        </label>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          {filtered.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-quiet">No people match that search.</p>
          )}
          {filtered.map((person) => (
            <button
              type="button"
              key={person.id}
              disabled={saving}
              onClick={() => {
                if (tab === "direct") {
                  void openDirect(person.id);
                } else {
                  toggleMember(person.id);
                }
              }}
              className="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-2xl px-2 py-2 text-left transition hover:bg-hover"
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
              {tab === "group" && (
                <span
                  className={`h-4 w-4 shrink-0 rounded border ${
                    selected.includes(person.id)
                      ? "border-accent bg-accent"
                      : "border-line"
                  }`}
                />
              )}
            </button>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-failed">{error}</p>}

        {tab === "group" && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void createGroup()}
            className="mt-4 w-full rounded-xl bg-accent py-2.5 font-medium text-white transition hover:bg-accent-hover hover:scale-[1.01] disabled:opacity-60"
          >
            Create group
          </button>
        )}
      </div>
    </div>
  );
}

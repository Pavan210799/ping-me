import { Check, Pencil, Plus, Search, Settings, UserMinus, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { formatLastSeen } from "../../lib/format";
import type { User } from "../../types";
import { Avatar } from "../Avatar";

export function GroupSettingsModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { activeChat, users, usersById, renameGroup, addGroupMember, removeGroupMember } = useChat();
  const [view, setView] = useState<"members" | "add">("members");
  const [editingName, setEditingName] = useState(false);
  const [groupName, setGroupName] = useState(activeChat?.name || "");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<{ action: "add" | "remove"; person: User } | null>(null);

  const members = useMemo(() => {
    if (!activeChat) {
      return [];
    }
    const list: User[] = [];
    for (let i = 0; i < activeChat.memberIds.length; i += 1) {
      const person = usersById[activeChat.memberIds[i]];
      if (person) {
        list.push(person);
      }
    }
    list.sort(function (a, b) {
      if (a.id === user?.id) {
        return -1;
      }
      if (b.id === user?.id) {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [activeChat, usersById, user?.id]);

  const addable = useMemo(() => {
    if (!activeChat) {
      return [];
    }
    const inGroup: { [id: string]: boolean } = {};
    for (let i = 0; i < activeChat.memberIds.length; i += 1) {
      inGroup[activeChat.memberIds[i]] = true;
    }
    const list: User[] = [];
    for (let i = 0; i < users.length; i += 1) {
      if (!inGroup[users[i].id]) {
        list.push(users[i]);
      }
    }
    return list;
  }, [activeChat, users]);

  if (!user || !activeChat || activeChat.type !== "group") {
    return null;
  }

  const chat = activeChat;
  const needle = query.trim().toLowerCase();
  const visibleAddable = needle
    ? addable.filter(function (person) {
        return (
          person.name.toLowerCase().includes(needle) ||
          person.email.toLowerCase().includes(needle)
        );
      })
    : addable;

  async function saveName(event?: FormEvent) {
    if (event) {
      event.preventDefault();
    }
    const nextName = groupName.trim();
    if (!nextName || nextName === chat.name) {
      setEditingName(false);
      setGroupName(chat.name);
      return;
    }
    setError("");
    setSaving(true);
    try {
      await renameGroup(nextName);
      setEditingName(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename group.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmAction() {
    if (!confirm) {
      return;
    }
    setError("");
    setSaving(true);
    try {
      if (confirm.action === "add") {
        await addGroupMember(confirm.person.id);
        setView("members");
        setQuery("");
      } else {
        await removeGroupMember(confirm.person.id);
      }
      setConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update group.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-line bg-surface p-5 shadow-xl animate-pop-in"
        onClick={function (event) {
          event.stopPropagation();
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-accent" />
            <h3 className="text-lg font-semibold">
              {view === "add" ? "Add member" : "Group settings"}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-hover" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {view === "members" && (
          <div className="mb-4 flex items-center gap-2">
            {editingName ? (
              <form onSubmit={(event) => void saveName(event)} className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  autoFocus
                  className="min-w-0 flex-1 rounded-xl border border-line bg-card px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-accent p-2 text-white transition hover:bg-accent-hover disabled:opacity-60"
                  aria-label="Save group name"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingName(false);
                    setGroupName(activeChat.name);
                  }}
                  className="rounded-xl p-2 text-quiet transition hover:bg-hover"
                  aria-label="Cancel"
                >
                  <X size={16} />
                </button>
              </form>
            ) : (
              <>
                <p className="min-w-0 flex-1 truncate text-base font-semibold">{activeChat.name}</p>
                <button
                  type="button"
                  onClick={() => {
                    setGroupName(activeChat.name);
                    setEditingName(true);
                  }}
                  className="rounded-xl p-2 text-quiet transition hover:bg-hover hover:text-ink"
                  aria-label="Edit group name"
                >
                  <Pencil size={16} />
                </button>
              </>
            )}
          </div>
        )}

        {view === "add" && (
          <label className="mb-3 flex items-center gap-2 rounded-xl border border-line bg-muted px-3 py-2 text-quiet transition focus-within:border-accent">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people"
              className="w-full min-w-0 bg-transparent text-sm text-ink outline-none"
            />
          </label>
        )}

        {view === "members" && (
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">
              Users
              <span className="ml-2 font-normal text-quiet">{members.length}</span>
            </p>
            <button
              type="button"
              onClick={() => {
                setView("add");
                setQuery("");
                setError("");
              }}
              className="rounded-xl p-1.5 text-accent transition hover:bg-hover hover:scale-110"
              aria-label="Add member"
            >
              <Plus size={18} />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          {view === "members" &&
            members.map((person) => {
              const isYou = person.id === user.id;
              const isAdmin = activeChat.adminIds.includes(person.id);
              return (
                <button
                  type="button"
                  key={person.id}
                  disabled={saving || isYou}
                  onClick={() => {
                    if (!isYou) {
                      setConfirm({ action: "remove", person });
                    }
                  }}
                  className="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-2xl px-2 py-2 text-left transition hover:bg-hover disabled:hover:bg-transparent"
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
                    <span className="block truncate font-medium">
                      {person.name}
                      {isYou ? " (You)" : ""}
                    </span>
                    <span className="block truncate text-xs text-quiet">
                      {isAdmin ? "Admin" : person.online ? "Online" : "Member"}
                    </span>
                  </span>
                  {!isYou && <UserMinus size={16} className="shrink-0 text-quiet" />}
                </button>
              );
            })}

          {view === "add" && visibleAddable.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-quiet">
              {addable.length === 0
                ? "Everyone is already in this group."
                : "No people match that search."}
            </p>
          )}
          {view === "add" &&
            visibleAddable.map((person) => (
              <button
                type="button"
                key={person.id}
                disabled={saving}
                onClick={() => setConfirm({ action: "add", person })}
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
                <Plus size={16} className="shrink-0 text-accent" />
              </button>
            ))}
        </div>

        {view === "add" && (
          <button
            type="button"
            onClick={() => {
              setView("members");
              setQuery("");
              setError("");
            }}
            className="mt-3 w-full rounded-xl border border-line py-2.5 text-sm font-medium transition hover:bg-hover"
          >
            Back to members
          </button>
        )}

        {error && <p className="mt-3 text-sm text-failed">{error}</p>}
      </div>

      {confirm && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-ink/30 p-4"
          onClick={function (event) {
            event.stopPropagation();
            if (!saving) {
              setConfirm(null);
            }
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-xl animate-pop-in"
            onClick={function (event) {
              event.stopPropagation();
            }}
          >
            <p className="text-base font-semibold">
              {confirm.action === "add" ? "Add member?" : "Remove member?"}
            </p>
            <p className="mt-2 text-sm text-quiet">
              {confirm.action === "add"
                ? `Add ${confirm.person.name} to ${activeChat.name}?`
                : `Remove ${confirm.person.name} from ${activeChat.name}?`}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setConfirm(null)}
                className="rounded-xl border border-line py-2 text-sm font-medium transition hover:bg-hover disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void confirmAction()}
                className={`rounded-xl py-2 text-sm font-medium text-white transition hover:scale-[1.01] disabled:opacity-60 ${
                  confirm.action === "add" ? "bg-accent hover:bg-accent-hover" : "bg-failed hover:opacity-90"
                }`}
              >
                {saving ? "Please wait..." : confirm.action === "add" ? "Add" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

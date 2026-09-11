import { Check, CheckCheck, FileText, MoreVertical, RotateCcw, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { fileSizeLabel, formatTime } from "../../lib/format";
import { mediaUrl } from "../../lib/backend";
import type { Message } from "../../types";
import { Avatar } from "../Avatar";
import { REACTION_EMOJIS, ThemeEmoji } from "./ThemeEmoji";

const BURSTS = [
  { x: "-12px", y: "-28px" },
  { x: "10px", y: "-32px" },
  { x: "0px", y: "-22px" },
];

export function MessageBubble({
  message,
  showAuthor,
}: {
  message: Message;
  showAuthor: boolean;
}) {
  const { user } = useAuth();
  const {
    usersById,
    messages,
    setReplyTo,
    editMessage,
    deleteMessage,
    reactToMessage,
    retryMessage,
  } = useChat();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);
  const [burst, setBurst] = useState<{ emoji: string; key: number } | null>(null);
  const [bounceEmoji, setBounceEmoji] = useState("");
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen && !pickerOpen) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!actionsRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen, pickerOpen]);

  if (!user) {
    return null;
  }

  const mine = message.senderId === user.id;
  const sender = usersById[message.senderId];
  const reply = message.replyToId
    ? messages.find((item) => item.id === message.replyToId)
    : undefined;
  const reactions = message.reactions || [];
  const attachments = message.attachments || [];
  const myReaction = reactions.find((reaction) => reaction.userId === user.id)?.emoji;

  async function copyText() {
    await navigator.clipboard.writeText(message.text);
    setMenuOpen(false);
  }

  function react(emoji: string) {
    setBurst({ emoji, key: Date.now() });
    setBounceEmoji(emoji);
    window.setTimeout(() => setBurst(null), 700);
    window.setTimeout(() => setBounceEmoji(""), 500);
    reactToMessage(message.id, emoji);
    setPickerOpen(false);
    setMenuOpen(false);
  }

  const showActions = !message.deletedAt;

  return (
    <div className={`group flex gap-2 animate-message-in ${mine ? "justify-end" : "justify-start"}`}>
      {!mine && (
        <div className="mt-auto">
          {showAuthor ? (
            <Avatar
              name={sender?.name ?? "User"}
              color={sender?.avatarColor ?? "#9a9087"}
              imageUrl={sender?.avatarUrl}
              userId={message.senderId}
              size={28}
            />
          ) : (
            <div className="w-7" />
          )}
        </div>
      )}
      <div className={`max-w-[80%] md:max-w-[65%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
        {showAuthor && !mine && (
          <p className="mb-1 px-1 text-xs text-quiet">{sender?.name}</p>
        )}

        <div ref={actionsRef} className="flex items-start gap-1">
          <div
            className={`relative mb-2 rounded-2xl px-3 py-2 shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md ${
              mine
                ? "rounded-br-md bg-bubble-sent text-bubble-sent-text"
                : "rounded-bl-md bg-bubble-received/90 text-ink backdrop-blur-sm"
            }`}
            onContextMenu={(event) => {
              event.preventDefault();
              setPickerOpen(false);
              setMenuOpen(true);
            }}
          >
            {pickerOpen && (
              <div className="absolute -top-12 left-1/2 z-20 flex -translate-x-1/2 animate-pop-in gap-0.5 rounded-full border border-line bg-card px-1.5 py-1 shadow-lg">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => react(emoji)}
                    className={`ig-react-pick rounded-full p-1 transition ${
                      myReaction === emoji ? "scale-110" : ""
                    }`}
                    aria-label={`React with ${emoji}`}
                  >
                    <ThemeEmoji emoji={emoji} size={20} />
                  </button>
                ))}
              </div>
            )}
            {burst &&
              BURSTS.map((offset, index) => (
                <span
                  key={`${burst.key}-${index}`}
                  className="animate-react-burst pointer-events-none absolute top-0 right-3"
                  style={{
                    ["--burst-x" as string]: offset.x,
                    ["--burst-y" as string]: offset.y,
                    animationDelay: `${index * 40}ms`,
                  }}
                >
                  <ThemeEmoji emoji={burst.emoji} size={18} />
                </span>
              ))}
            {reply && (
              <div
                className={`mb-2 border-l-2 pl-2 text-xs ${
                  mine ? "border-white/50 text-white/80" : "border-accent text-quiet"
                }`}
              >
                {reply.text || "Attachment"}
              </div>
            )}

            {message.deletedAt ? (
              <p className="italic opacity-70">This message was deleted</p>
            ) : editing ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  editMessage(message.id, draft);
                  setEditing(false);
                }}
              >
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="w-full rounded-lg bg-white/20 px-2 py-1 text-sm outline-none"
                />
              </form>
            ) : (
              <>
                {attachments.map((file) =>
                  file.kind === "image" ? (
                    <img
                      key={file.id}
                      src={mediaUrl(file.url)}
                      alt={file.name}
                      className="mb-2 max-h-56 rounded-xl object-cover"
                    />
                  ) : (
                    <a
                      key={file.id}
                      href={mediaUrl(file.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="mb-2 flex items-center gap-2 rounded-xl bg-black/10 px-2 py-2 text-sm"
                    >
                      <FileText size={16} />
                      <span>
                        {file.name}
                        <span className="block text-xs opacity-70">
                          {fileSizeLabel(file.size)}
                        </span>
                      </span>
                    </a>
                  ),
                )}
                {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
              </>
            )}

            <div className={`mt-1 flex items-center gap-1 text-[11px] ${mine ? "justify-end text-white/80" : "text-subtle"}`}>
              {message.updatedAt && !message.deletedAt && <span>edited</span>}
              <span>{formatTime(message.createdAt)}</span>
              {mine && message.status === "failed" && <span className="text-failed">Failed</span>}
              {mine && message.status === "sending" && <span>Sending</span>}
              {mine && message.status === "sent" && <Check size={12} />}
              {mine && message.status === "delivered" && <CheckCheck size={12} />}
              {mine && message.status === "read" && (
                <CheckCheck size={12} className="text-tick-read" />
              )}
            </div>

            {reactions.length > 0 && (
              <div className="absolute -bottom-3 left-2 flex gap-1">
                {Object.entries(
                  reactions.reduce<Record<string, number>>((counts, reaction) => {
                    counts[reaction.emoji] = (counts[reaction.emoji] ?? 0) + 1;
                    return counts;
                  }, {}),
                ).map(([emoji, count]) => (
                  <button
                    type="button"
                    key={`${message.id}-${emoji}-${count}`}
                    onClick={() => react(emoji)}
                    className={`flex items-center gap-0.5 rounded-full border border-line bg-card px-1.5 py-0.5 text-[11px] shadow-sm transition hover:scale-110 ${
                      bounceEmoji === emoji ? "animate-ig-react" : ""
                    } ${emoji === "❤️" && bounceEmoji === emoji ? "ig-react-heart" : ""} ${
                      myReaction === emoji ? "ring-1 ring-accent" : ""
                    }`}
                  >
                    <ThemeEmoji emoji={emoji} size={14} />
                    {count > 1 ? count : ""}
                  </button>
                ))}
              </div>
            )}
          </div>

          {showActions && (
            <div className="relative mt-1 flex shrink-0 flex-col gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setPickerOpen((open) => !open);
                  setMenuOpen(false);
                }}
                className="rounded-full p-1 text-quiet transition hover:bg-card hover:text-ink hover:scale-110"
                aria-label="React to message"
              >
                <Smile size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen((open) => !open);
                  setPickerOpen(false);
                }}
                className="rounded-full p-1 text-quiet transition hover:bg-card hover:text-ink hover:scale-110"
                aria-label="More options"
              >
                <MoreVertical size={16} />
              </button>

              {menuOpen && (
                <div
                  className={`absolute top-7 z-20 w-32 animate-pop-in rounded-xl border border-line bg-card p-1 text-sm shadow-lg ${
                    mine ? "right-8" : "left-8"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setReplyTo(message);
                      setMenuOpen(false);
                    }}
                    className="block w-full rounded-lg px-3 py-1.5 text-left transition hover:bg-hover"
                  >
                    Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyText()}
                    className="block w-full rounded-lg px-3 py-1.5 text-left transition hover:bg-hover"
                  >
                    Copy
                  </button>
                  {mine && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(true);
                          setMenuOpen(false);
                        }}
                        className="block w-full rounded-lg px-3 py-1.5 text-left transition hover:bg-hover"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteMessage(message.id);
                          setMenuOpen(false);
                        }}
                        className="block w-full rounded-lg px-3 py-1.5 text-left text-failed transition hover:bg-hover"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {mine && message.status === "failed" && (
          <button
            type="button"
            onClick={() => void retryMessage(message)}
            className="mt-1 flex items-center gap-1 text-xs text-failed transition hover:underline"
          >
            <RotateCcw size={12} /> Retry
          </button>
        )}
      </div>
    </div>
  );
}

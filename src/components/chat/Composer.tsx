import { Paperclip, Send, X } from "lucide-react";
import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import { useChat } from "../../context/ChatContext";

export function Composer() {
  const {
    sendMessage,
    startTyping,
    stopTyping,
    replyTo,
    setReplyTo,
    uploadProgress,
    connectionStatus,
  } = useChat();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef(0);

  function handleChange(value: string) {
    setText(value);
    startTyping();
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      stopTyping();
    }, 1200);
  }

  async function submit() {
    const outgoing = text;
    const outgoingFiles = files;
    setText("");
    setFiles([]);
    stopTyping();
    await sendMessage(outgoing, outgoingFiles);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <form onSubmit={onSubmit} className="border-t border-line bg-surface/85 p-3 backdrop-blur-xl">
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
          <p className="truncate text-quiet">
            Replying: {replyTo.text || "Attachment"}
          </p>
          <button type="button" onClick={() => setReplyTo(null)}>
            <X size={14} />
          </button>
        </div>
      )}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((file) => (
            <span key={file.name} className="rounded-lg bg-muted px-2 py-1 text-xs text-secondary">
              {file.name}
            </span>
          ))}
        </div>
      )}
      {uploadProgress !== null && (
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-accent" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-xl p-2 text-quiet transition hover:bg-hover hover:text-ink hover:scale-110"
          aria-label="Attach file"
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          onChange={(event) => {
            setFiles(Array.from(event.target.files ?? []));
          }}
        />
        <textarea
          value={text}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={connectionStatus === "connected" ? "Write a message" : "Waiting for connection..."}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-line bg-muted px-3 py-2.5 outline-none transition focus:border-accent"
        />
        <button
          type="submit"
          disabled={connectionStatus !== "connected" || (!text.trim() && files.length === 0)}
          className="rounded-xl bg-accent p-2.5 text-white transition hover:bg-accent-hover hover:scale-110 active:scale-95 disabled:opacity-50"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </div>
    </form>
  );
}

import { X } from "lucide-react";
import { useChat } from "../../context/ChatContext";

export function ToastStack() {
  const { toasts, dismissToast, selectChat } = useChat();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-2 rounded-2xl border border-line bg-card p-3 shadow-sm animate-fade-in"
        >
          <button
            type="button"
            onClick={() => {
              void selectChat(toast.chatId);
              dismissToast(toast.id);
            }}
            className="min-w-0 flex-1 text-left"
          >
            <p className="text-sm font-medium">{toast.title}</p>
            <p className="truncate text-xs text-quiet">{toast.body}</p>
          </button>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="rounded-lg p-1 text-quiet transition hover:bg-hover hover:text-ink hover:scale-110"
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

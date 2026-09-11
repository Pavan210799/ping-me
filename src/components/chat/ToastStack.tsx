import { X } from "lucide-react";
import { useEffect } from "react";
import { useChat } from "../../context/ChatContext";
import type { ToastItem } from "../../types";

function ToastCard({ toast }: { toast: ToastItem }) {
  const { dismissToast, selectChat } = useChat();

  useEffect(() => {
    const timer = window.setTimeout(function () {
      dismissToast(toast.id);
    }, 2000);
    return function () {
      window.clearTimeout(timer);
    };
  }, [toast.id]);

  return (
    <div className="pointer-events-auto flex min-w-0 items-start gap-2 overflow-hidden rounded-2xl border border-line bg-card px-3 py-2 shadow-sm animate-fade-in">
      <button
        type="button"
        onClick={() => {
          void selectChat(toast.chatId);
          dismissToast(toast.id);
        }}
        className="min-w-0 flex-1 overflow-hidden text-left"
      >
        <p className="truncate text-sm font-medium">{toast.title}</p>
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
  );
}

export function ToastStack() {
  const { toasts } = useChat();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-3 bottom-[5.75rem] z-50 flex w-52 flex-col gap-2 md:right-4 md:w-80">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

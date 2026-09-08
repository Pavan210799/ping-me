import { useEffect, useLayoutEffect, useRef } from "react";
import { useChat } from "../../context/ChatContext";
import { formatDay } from "../../lib/format";
import { MessageBubble } from "./MessageBubble";

export function MessageList() {
  const { messages, hasMore, loadingMessages, loadingMore, loadMore, chatError } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingAdjust = useRef<number | null>(null);

  useEffect(() => {
    if (pendingAdjust.current !== null) {
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages[messages.length - 1]?.id]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || pendingAdjust.current === null) {
      return;
    }
    el.scrollTop = el.scrollHeight - pendingAdjust.current;
    pendingAdjust.current = null;
  }, [messages.length]);

  useEffect(() => {
    const node = topRef.current;
    const scroller = scrollRef.current;
    if (!node || !scroller) {
      return;
    }

    let armed = false;
    const arm = () => {
      if (scroller.scrollTop > 40) {
        armed = true;
      }
    };
    scroller.addEventListener("scroll", arm, { passive: true });

    const observer = new IntersectionObserver((entries) => {
      if (!armed || !entries[0]?.isIntersecting || !hasMore || loadingMore) {
        return;
      }
      pendingAdjust.current = scroller.scrollHeight;
      void loadMore();
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", arm);
    };
  }, [hasMore, loadMore, loadingMore]);

  if (loadingMessages) {
    return (
      <div className="space-y-3 p-4">
        <div className="ml-auto h-12 w-2/3 animate-pulse rounded-2xl bg-hover/80" />
        <div className="h-12 w-1/2 animate-pulse rounded-2xl bg-card/80" />
        <div className="ml-auto h-16 w-1/2 animate-pulse rounded-2xl bg-hover/80" />
      </div>
    );
  }

  if (chatError) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <p className="rounded-2xl bg-failed/10 px-4 py-3 text-sm text-failed">{chatError}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="grid h-full place-items-center p-6 text-center text-quiet">
        No messages yet. Say hello.
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex h-full flex-col gap-3 overflow-y-auto px-4 py-4">
      <div ref={topRef} />
      {hasMore && (
        <button
          type="button"
          onClick={() => {
            const el = scrollRef.current;
            pendingAdjust.current = el?.scrollHeight ?? 0;
            void loadMore();
          }}
          className="mx-auto rounded-full border border-line bg-card/80 px-3 py-1 text-xs text-accent shadow-sm backdrop-blur-sm transition hover:scale-105 hover:bg-hover"
        >
          {loadingMore ? "Loading earlier messages..." : "Load earlier messages"}
        </button>
      )}
      {messages.filter((message) => !message.deletedAt).map((message, index, visible) => {
        const previous = visible[index - 1];
        const newDay = !previous || formatDay(previous.createdAt) !== formatDay(message.createdAt);
        const showAuthor = !previous || previous.senderId !== message.senderId || newDay;
        return (
          <div key={message.id}>
            {newDay && (
              <p className="my-3 text-center text-xs text-subtle">{formatDay(message.createdAt)}</p>
            )}
            <MessageBubble message={message} showAuthor={showAuthor} />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

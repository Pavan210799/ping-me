import { useEffect, useLayoutEffect, useRef } from "react";
import { useChat } from "../../context/ChatContext";
import { formatDay } from "../../lib/format";
import type { Message } from "../../types";
import { MessageBubble } from "./MessageBubble";
import { TypingBubble } from "./TypingBubble";

export function MessageList() {
  const {
    activeChatId,
    messages,
    hasMore,
    loadingMessages,
    loadingMore,
    loadMore,
    chatError,
    typingUserIds,
    highlightMessageId,
    highlightNonce,
  } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingAdjust = useRef<number | null>(null);
  const armedRef = useRef(false);
  const stickToBottomRef = useRef(true);
  const loadingMoreRef = useRef(loadingMore);
  loadingMoreRef.current = loadingMore;

  useEffect(() => {
    armedRef.current = false;
    stickToBottomRef.current = true;
    pendingAdjust.current = null;
  }, [activeChatId]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || loadingMessages) {
      return;
    }

    if (pendingAdjust.current !== null) {
      el.scrollTop = el.scrollHeight - pendingAdjust.current;
      pendingAdjust.current = null;
    }

    if (highlightMessageId) {
      stickToBottomRef.current = false;
      const node = el.querySelector('[data-message-id="' + highlightMessageId + '"]');
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }

    if (hasMore && !loadingMore && el.scrollHeight <= el.clientHeight + 8) {
      void loadMore();
    }
  }, [activeChatId, loadingMessages, messages.length, hasMore, loadingMore, loadMore, highlightMessageId, highlightNonce]);

  useEffect(() => {
    if (pendingAdjust.current !== null || !stickToBottomRef.current || highlightMessageId) {
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages[messages.length - 1]?.id, typingUserIds.length, loadingMessages, highlightMessageId]);

  useEffect(() => {
    const node = topRef.current;
    const scroller = scrollRef.current;
    if (!node || !scroller || loadingMessages) {
      return;
    }
    const list = scroller;

    function onScroll() {
      if (list.scrollTop > 40) {
        armedRef.current = true;
      }
      const fromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
      stickToBottomRef.current = fromBottom < 80;
    }

    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      function (entries) {
        if (!armedRef.current || !entries[0]?.isIntersecting || !hasMore || loadingMoreRef.current) {
          return;
        }
        stickToBottomRef.current = false;
        pendingAdjust.current = scroller.scrollHeight;
        void loadMore();
      },
      { root: scroller, rootMargin: "64px 0px 0px 0px" },
    );
    observer.observe(node);
    return function () {
      observer.disconnect();
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [hasMore, loadMore, messages.length, loadingMessages, activeChatId]);

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

  const visibleMessages: Message[] = [];
  for (let i = 0; i < messages.length; i += 1) {
    if (!messages[i].deletedAt) {
      visibleMessages.push(messages[i]);
    }
  }

  if (visibleMessages.length === 0 && typingUserIds.length === 0) {
    return (
      <div className="grid h-full place-items-center p-6 text-center text-quiet">
        No messages yet. Say hello.
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">
      <div className="flex min-h-full flex-col justify-end gap-3 px-4 py-4">
        <div ref={topRef} />
        {loadingMore && (
          <div className="flex w-full flex-col gap-3 py-3">
            <div className="h-10 w-1/2 animate-pulse rounded-2xl bg-card/90" />
            <div className="ml-auto h-10 w-2/3 animate-pulse rounded-2xl bg-hover/80" />
            <p className="mx-auto rounded-full border border-line bg-card px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-accent shadow-sm">
              Loading earlier messages...
            </p>
          </div>
        )}
        {visibleMessages.map((message, index) => {
          const previous = visibleMessages[index - 1];
          const newDay = !previous || formatDay(previous.createdAt) !== formatDay(message.createdAt);
          const isSystem = message.kind === "system" || message.senderId === "system";
          const showAuthor =
            !isSystem && (!previous || previous.senderId !== message.senderId || newDay);
          return (
            <div
              key={message.id}
              data-message-id={message.id}
              className={
                highlightMessageId === message.id
                  ? "animate-message-focus rounded-2xl px-1 py-1"
                  : undefined
              }
            >
              {newDay && (
                <p className="my-3 text-center text-xs text-subtle">{formatDay(message.createdAt)}</p>
              )}
              {isSystem ? (
                <p className="mx-auto max-w-[90%] rounded-full border border-line bg-card/85 px-3.5 py-1.5 text-center text-[11px] font-medium text-quiet shadow-sm">
                  {message.text}
                </p>
              ) : (
                <MessageBubble message={message} showAuthor={showAuthor} />
              )}
            </div>
          );
        })}
        {typingUserIds.map((userId) => (
          <TypingBubble key={userId} userId={userId} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

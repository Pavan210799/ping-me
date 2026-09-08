import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  chatsRequest,
  createDirectChatRequest,
  createGroupChatRequest,
  messagesRequest,
  searchMessagesRequest,
  uploadFile,
  usersRequest,
} from "../api";
import { connectChatSocket, type ChatSocket } from "../socket";
import type {
  Attachment,
  Chat,
  ConnectionStatus,
  Message,
  ServerEvent,
  ToastItem,
  User,
} from "../types";
import { useAuth } from "./AuthContext";

type ChatContextValue = {
  chats: Chat[];
  users: User[];
  usersById: Record<string, User>;
  activeChatId: string | null;
  activeChat: Chat | null;
  messages: Message[];
  hasMore: boolean;
  loadingChats: boolean;
  loadingMessages: boolean;
  loadingMore: boolean;
  chatError: string;
  connectionStatus: ConnectionStatus;
  typingUserIds: string[];
  toasts: ToastItem[];
  searchResults: Message[];
  searching: boolean;
  uploadProgress: number | null;
  replyTo: Message | null;
  setReplyTo: (message: Message | null) => void;
  selectChat: (chatId: string | null) => void;
  loadMore: () => Promise<void>;
  sendMessage: (text: string, files?: File[]) => Promise<void>;
  retryMessage: (message: Message) => Promise<void>;
  editMessage: (messageId: string, text: string) => void;
  deleteMessage: (messageId: string) => void;
  reactToMessage: (messageId: string, emoji: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  searchInChat: (query: string) => Promise<void>;
  startDirectChat: (userId: string) => Promise<void>;
  startGroupChat: (name: string, memberIds: string[]) => Promise<void>;
  dismissToast: (id: string) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);
const REACTIONS_WAIT_MS = 8000;

function upsertMessage(list: Message[], incoming: Message): Message[] {
  const byClient = incoming.clientId
    ? list.findIndex((item) => item.clientId === incoming.clientId)
    : -1;
  const byId = list.findIndex((item) => item.id === incoming.id);
  const index = byClient >= 0 ? byClient : byId;
  if (index === -1) {
    return [...list, incoming];
  }
  const next = [...list];
  next[index] = incoming;
  return next;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const socketRef = useRef<ChatSocket | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const failTimers = useRef<Record<string, number>>({});

  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>({});
  const [hasMoreByChat, setHasMoreByChat] = useState<Record<string, boolean>>({});
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [chatError, setChatError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("offline");
  const [typingByChat, setTypingByChat] = useState<Record<string, string[]>>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  activeChatIdRef.current = activeChatId;

  const usersById = useMemo(() => {
    const map: Record<string, User> = {};
    for (const person of users) {
      map[person.id] = person;
    }
    if (user) {
      map[user.id] = user;
    }
    return map;
  }, [users, user]);
  const usersByIdRef = useRef(usersById);
  usersByIdRef.current = usersById;

  const refreshLists = useCallback(async () => {
    const [nextChats, nextUsers] = await Promise.all([chatsRequest(), usersRequest()]);
    setChats(nextChats);
    setUsers(nextUsers);
  }, []);

  const markVisibleRead = useCallback((chatId: string, list: Message[]) => {
    if (!user) {
      return;
    }
    const unreadIds = list
      .filter((message) => message.senderId !== user.id && !message.readBy.includes(user.id))
      .map((message) => message.id);
    if (unreadIds.length === 0) {
      return;
    }
    try {
      socketRef.current?.send({
        type: "message:read",
        chatId,
        messageIds: unreadIds,
      });
    } catch {
      // Socket may be reconnecting.
    }
  }, [user]);

  const handleEvent = useCallback(
    (event: ServerEvent) => {
      if (event.type === "presence") {
        setUsers((current) =>
          current.map((person) =>
            person.id === event.userId
              ? { ...person, online: event.online, lastSeen: event.lastSeen }
              : person,
          ),
        );
        return;
      }

      if (event.type === "typing") {
        setTypingByChat((current) => {
          const existing = current[event.chatId] ?? [];
          const nextIds = event.isTyping
            ? Array.from(new Set([...existing, event.userId]))
            : existing.filter((id) => id !== event.userId);
          return { ...current, [event.chatId]: nextIds };
        });
        return;
      }

      if (event.type === "unread") {
        setChats((current) =>
          current.map((chat) =>
            chat.id === event.chatId ? { ...chat, unreadCount: event.count } : chat,
          ),
        );
        return;
      }

      if (event.type === "message:new" || event.type === "message:updated") {
        const incoming = event.message;
        if (failTimers.current[incoming.clientId ?? incoming.id]) {
          window.clearTimeout(failTimers.current[incoming.clientId ?? incoming.id]);
          delete failTimers.current[incoming.clientId ?? incoming.id];
        }

        setMessagesByChat((current) => ({
          ...current,
          [incoming.chatId]: upsertMessage(current[incoming.chatId] ?? [], incoming),
        }));

        setChats((current) => {
          const exists = current.some((chat) => chat.id === incoming.chatId);
          if (!exists) {
            void refreshLists();
            return current;
          }
          return current
            .map((chat) => {
              if (chat.id !== incoming.chatId) {
                return chat;
              }
              const isIncoming =
                user && incoming.senderId !== user.id && event.type === "message:new";
              const isViewing = activeChatIdRef.current === incoming.chatId;
              return {
                ...chat,
                lastMessage: incoming,
                unreadCount: isIncoming && !isViewing ? chat.unreadCount + 1 : chat.unreadCount,
              };
            })
            .sort((a, b) => {
              const timeA = a.lastMessage?.createdAt ?? a.createdAt;
              const timeB = b.lastMessage?.createdAt ?? b.createdAt;
              return timeB.localeCompare(timeA);
            });
        });

        if (event.type === "message:new" && user && incoming.senderId !== user.id) {
          const viewing = activeChatIdRef.current === incoming.chatId && !document.hidden;
          if (viewing) {
            markVisibleRead(incoming.chatId, [incoming]);
          } else {
            const senderName = usersByIdRef.current[incoming.senderId]?.name ?? "New message";
            const toast: ToastItem = {
              id: incoming.id,
              title: senderName,
              body: incoming.text || "Sent an attachment",
              chatId: incoming.chatId,
            };
            setToasts((current) => [toast, ...current].slice(0, 4));
            if (Notification.permission === "granted") {
              new Notification(`PingMe · ${senderName}`, {
                body: incoming.text || "Sent an attachment",
              });
            }
          }
        }
        return;
      }

      if (event.type === "message:deleted") {
        setMessagesByChat((current) => ({
          ...current,
          [event.chatId]: (current[event.chatId] ?? []).filter(
            (item) => item.id !== event.messageId,
          ),
        }));
        void refreshLists();
        return;
      }

      if (event.type === "error") {
        setChatError(event.message);
      }
    },
    [markVisibleRead, refreshLists, user],
  );

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    setLoadingChats(true);
    refreshLists()
      .catch((error: Error) => {
        setChatError(error.message);
      })
      .finally(() => {
        setLoadingChats(false);
      });

    const socket = connectChatSocket({
      token,
      onEvent: handleEvent,
      onStatus: (status) => {
        setConnectionStatus(status);
        if (status === "connected") {
          void refreshLists();
        }
      },
    });
    socketRef.current = socket;

    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [token, user, refreshLists, handleEvent]);

  const selectChat = useCallback(
    async (chatId: string | null) => {
      setActiveChatId(chatId);
      setReplyTo(null);
      setSearchResults([]);
      setChatError("");
      if (!chatId) {
        return;
      }
      if (messagesByChat[chatId]) {
        markVisibleRead(chatId, messagesByChat[chatId]);
        return;
      }
      setLoadingMessages(true);
      try {
        const result = await messagesRequest(chatId);
        setMessagesByChat((current) => ({ ...current, [chatId]: result.messages }));
        setHasMoreByChat((current) => ({ ...current, [chatId]: result.hasMore }));
        markVisibleRead(chatId, result.messages);
      } catch (error) {
        setChatError(error instanceof Error ? error.message : "Could not load messages.");
      } finally {
        setLoadingMessages(false);
      }
    },
    [markVisibleRead, messagesByChat],
  );

  const loadMore = useCallback(async () => {
    if (!activeChatId || loadingMore || !hasMoreByChat[activeChatId]) {
      return;
    }
    const current = messagesByChat[activeChatId] ?? [];
    const oldest = current[0];
    if (!oldest) {
      return;
    }
    setLoadingMore(true);
    try {
      const result = await messagesRequest(activeChatId, oldest.id);
      setMessagesByChat((existing) => ({
        ...existing,
        [activeChatId]: [...result.messages, ...(existing[activeChatId] ?? [])],
      }));
      setHasMoreByChat((existing) => ({ ...existing, [activeChatId]: result.hasMore }));
    } finally {
      setLoadingMore(false);
    }
  }, [activeChatId, hasMoreByChat, loadingMore, messagesByChat]);

  const queueFailTimer = useCallback((clientId: string, chatId: string) => {
    failTimers.current[clientId] = window.setTimeout(() => {
      setMessagesByChat((current) => ({
        ...current,
        [chatId]: (current[chatId] ?? []).map((message) =>
          message.clientId === clientId ? { ...message, status: "failed" } : message,
        ),
      }));
    }, REACTIONS_WAIT_MS);
  }, []);

  const sendOptimistic = useCallback(
    async (text: string, attachments: Attachment[], retryOf?: Message) => {
      if (!user || !activeChatId) {
        return;
      }
      const clientId = retryOf?.clientId ?? `temp-${crypto.randomUUID()}`;
      const optimistic: Message = {
        id: retryOf?.id ?? clientId,
        chatId: activeChatId,
        senderId: user.id,
        text,
        createdAt: retryOf?.createdAt ?? new Date().toISOString(),
        replyToId: retryOf?.replyToId ?? replyTo?.id,
        clientId,
        attachments,
        reactions: [],
        status: "sending",
        deliveredTo: [],
        readBy: [],
      };

      setMessagesByChat((current) => ({
        ...current,
        [activeChatId]: retryOf
          ? (current[activeChatId] ?? []).map((message) =>
              message.clientId === clientId ? optimistic : message,
            )
          : [...(current[activeChatId] ?? []), optimistic],
      }));
      setReplyTo(null);
      queueFailTimer(clientId, activeChatId);

      const sent = socketRef.current?.send({
        type: "message:send",
        chatId: activeChatId,
        text,
        replyToId: optimistic.replyToId,
        clientId,
        attachments,
      });
      if (!sent) {
        setMessagesByChat((current) => ({
          ...current,
          [activeChatId]: (current[activeChatId] ?? []).map((message) =>
            message.clientId === clientId ? { ...message, status: "failed" } : message,
          ),
        }));
      }
    },
    [activeChatId, queueFailTimer, replyTo, user],
  );

  const sendMessage = useCallback(
    async (text: string, files: File[] = []) => {
      if (!token || !activeChatId) {
        return;
      }
      if (!text.trim() && files.length === 0) {
        return;
      }

      const attachments: Attachment[] = [];
      try {
        for (const file of files) {
          setUploadProgress(0);
          const uploaded = await uploadFile(file, token, (percent) => {
            setUploadProgress(percent);
          });
          attachments.push(uploaded);
        }
        setUploadProgress(null);
        await sendOptimistic(text.trim(), attachments);
      } catch (error) {
        setUploadProgress(null);
        setChatError(error instanceof Error ? error.message : "Could not send.");
      }
    },
    [activeChatId, sendOptimistic, token],
  );

  const retryMessage = useCallback(
    async (message: Message) => {
      await sendOptimistic(message.text, message.attachments, message);
    },
    [sendOptimistic],
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      chats,
      users,
      usersById,
      activeChatId,
      activeChat: chats.find((chat) => chat.id === activeChatId) ?? null,
      messages: activeChatId ? messagesByChat[activeChatId] ?? [] : [],
      hasMore: activeChatId ? Boolean(hasMoreByChat[activeChatId]) : false,
      loadingChats,
      loadingMessages,
      loadingMore,
      chatError,
      connectionStatus,
      typingUserIds: activeChatId ? typingByChat[activeChatId] ?? [] : [],
      toasts,
      searchResults,
      searching,
      uploadProgress,
      replyTo,
      setReplyTo,
      selectChat,
      loadMore,
      sendMessage,
      retryMessage,
      editMessage(messageId, text) {
        socketRef.current?.send({ type: "message:edit", messageId, text });
      },
      deleteMessage(messageId) {
        socketRef.current?.send({ type: "message:delete", messageId });
      },
      reactToMessage(messageId, emoji) {
        socketRef.current?.send({ type: "message:react", messageId, emoji });
      },
      startTyping() {
        if (activeChatId) {
          socketRef.current?.send({ type: "typing:start", chatId: activeChatId });
        }
      },
      stopTyping() {
        if (activeChatId) {
          socketRef.current?.send({ type: "typing:stop", chatId: activeChatId });
        }
      },
      async searchInChat(query) {
        if (!activeChatId) {
          return;
        }
        setSearching(true);
        try {
          const results = await searchMessagesRequest(activeChatId, query);
          setSearchResults(results);
        } finally {
          setSearching(false);
        }
      },
      async startDirectChat(userId) {
        const chat = await createDirectChatRequest(userId);
        await refreshLists();
        await selectChat(chat.id);
      },
      async startGroupChat(name, memberIds) {
        const chat = await createGroupChatRequest(name, memberIds);
        await refreshLists();
        await selectChat(chat.id);
      },
      dismissToast(id) {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      },
    }),
    [
      activeChatId,
      chatError,
      chats,
      connectionStatus,
      hasMoreByChat,
      loadMore,
      loadingChats,
      loadingMessages,
      loadingMore,
      messagesByChat,
      refreshLists,
      replyTo,
      retryMessage,
      searchResults,
      searching,
      selectChat,
      sendMessage,
      toasts,
      typingByChat,
      uploadProgress,
      users,
      usersById,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used inside ChatProvider");
  }
  return context;
}

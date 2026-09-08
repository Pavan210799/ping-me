import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  chatsRequest,
  createDirectChatRequest,
  createGroupChatRequest,
  messagesRequest,
  searchAllMessagesRequest,
  searchMessagesRequest,
  uploadFile,
  usersRequest,
} from "../api";
import { connectChatSocket } from "../socket";
import type { Attachment, Chat, Message, SocketEvent, ToastItem, User } from "../types";
import { useAuth } from "./AuthContext";

type ChatContextValue = {
  chats: Chat[];
  users: User[];
  usersById: { [id: string]: User };
  activeChatId: string | null;
  activeChat: Chat | null;
  messages: Message[];
  hasMore: boolean;
  loadingChats: boolean;
  loadingMessages: boolean;
  loadingMore: boolean;
  chatError: string;
  connectionStatus: string;
  typingUserIds: string[];
  toasts: ToastItem[];
  searchResults: Message[];
  searching: boolean;
  globalSearchResults: Message[];
  searchingGlobal: boolean;
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
  searchAllChats: (query: string) => Promise<void>;
  startDirectChat: (userId: string) => Promise<void>;
  startGroupChat: (name: string, memberIds: string[]) => Promise<void>;
  dismissToast: (id: string) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);
const FAIL_WAIT_MS = 8000;

function replaceOrAddMessage(list: Message[], incoming: Message) {
  const next = [];
  let replaced = false;

  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    const sameClient = incoming.clientId && item.clientId === incoming.clientId;
    const sameId = item.id === incoming.id;
    if (sameClient || sameId) {
      next.push(incoming);
      replaced = true;
    } else {
      next.push(item);
    }
  }

  if (!replaced) {
    next.push(incoming);
  }

  return next;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const socketRef = useRef<ReturnType<typeof connectChatSocket> | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const messagesByChatRef = useRef<{ [chatId: string]: Message[] }>({});
  const userRef = useRef(user);
  const usersByIdRef = useRef<{ [id: string]: User }>({});
  const failTimers = useRef<{ [id: string]: number }>({});

  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messagesByChat, setMessagesByChat] = useState<{ [chatId: string]: Message[] }>({});
  const [hasMoreByChat, setHasMoreByChat] = useState<{ [chatId: string]: boolean }>({});
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [chatError, setChatError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("offline");
  const [typingByChat, setTypingByChat] = useState<{ [chatId: string]: string[] }>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState<Message[]>([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  activeChatIdRef.current = activeChatId;
  messagesByChatRef.current = messagesByChat;
  userRef.current = user;

  const usersById: { [id: string]: User } = {};
  for (let i = 0; i < users.length; i += 1) {
    usersById[users[i].id] = users[i];
  }
  if (user) {
    usersById[user.id] = user;
  }
  usersByIdRef.current = usersById;

  async function refreshLists() {
    const nextChats = await chatsRequest();
    const nextUsers = await usersRequest();
    setChats(nextChats);
    setUsers(nextUsers);
  }

  function markVisibleRead(chatId: string, list: Message[]) {
    const currentUser = userRef.current;
    if (!currentUser) {
      return;
    }

    const unreadIds: string[] = [];
    for (let i = 0; i < list.length; i += 1) {
      const message = list[i];
      if (message.senderId !== currentUser.id && !message.readBy.includes(currentUser.id)) {
        unreadIds.push(message.id);
      }
    }

    if (unreadIds.length === 0) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.send({
        type: "message:read",
        chatId,
        messageIds: unreadIds,
      });
    }
  }

  function handleSocketEvent(event: SocketEvent) {
    const currentUser = userRef.current;

    if (event.type === "presence" && event.userId) {
      setUsers(function (current) {
        const next = [];
        for (let i = 0; i < current.length; i += 1) {
          const person = current[i];
          if (person.id === event.userId) {
            next.push({
              ...person,
              online: Boolean(event.online),
              lastSeen: event.lastSeen || person.lastSeen,
            });
          } else {
            next.push(person);
          }
        }
        return next;
      });
      return;
    }

    if (event.type === "typing" && event.chatId && event.userId) {
      setTypingByChat(function (current) {
        const existing = current[event.chatId as string] || [];
        let nextIds: string[] = [];
        if (event.isTyping) {
          nextIds = existing.slice();
          if (!nextIds.includes(event.userId as string)) {
            nextIds.push(event.userId as string);
          }
        } else {
          for (let i = 0; i < existing.length; i += 1) {
            if (existing[i] !== event.userId) {
              nextIds.push(existing[i]);
            }
          }
        }
        return { ...current, [event.chatId as string]: nextIds };
      });
      return;
    }

    if (event.type === "unread" && event.chatId) {
      setChats(function (current) {
        const next = [];
        for (let i = 0; i < current.length; i += 1) {
          const chat = current[i];
          if (chat.id === event.chatId) {
            next.push({ ...chat, unreadCount: event.count || 0 });
          } else {
            next.push(chat);
          }
        }
        return next;
      });
      return;
    }

    if ((event.type === "message:new" || event.type === "message:updated") && event.message && typeof event.message !== "string") {
      const incoming = event.message;
      const timerKey = incoming.clientId || incoming.id;
      if (failTimers.current[timerKey]) {
        window.clearTimeout(failTimers.current[timerKey]);
        delete failTimers.current[timerKey];
      }

      setMessagesByChat(function (current) {
        const list = current[incoming.chatId] || [];
        return {
          ...current,
          [incoming.chatId]: replaceOrAddMessage(list, incoming),
        };
      });

      setChats(function (current) {
        let exists = false;
        for (let i = 0; i < current.length; i += 1) {
          if (current[i].id === incoming.chatId) {
            exists = true;
          }
        }
        if (!exists) {
          void refreshLists();
          return current;
        }

        const next = [];
        for (let i = 0; i < current.length; i += 1) {
          const chat = current[i];
          if (chat.id !== incoming.chatId) {
            next.push(chat);
          } else {
            const isIncoming =
              currentUser && incoming.senderId !== currentUser.id && event.type === "message:new";
            const isViewing = activeChatIdRef.current === incoming.chatId;
            let unreadCount = chat.unreadCount;
            if (isIncoming && !isViewing) {
              unreadCount = chat.unreadCount + 1;
            }
            next.push({
              ...chat,
              lastMessage: incoming,
              unreadCount,
            });
          }
        }

        next.sort(function (a, b) {
          const timeA = a.lastMessage ? a.lastMessage.createdAt : a.createdAt;
          const timeB = b.lastMessage ? b.lastMessage.createdAt : b.createdAt;
          if (timeA > timeB) {
            return -1;
          }
          if (timeA < timeB) {
            return 1;
          }
          return 0;
        });
        return next;
      });

      if (event.type === "message:new" && currentUser && incoming.senderId !== currentUser.id) {
        const viewing = activeChatIdRef.current === incoming.chatId && !document.hidden;
        if (viewing) {
          markVisibleRead(incoming.chatId, [incoming]);
        } else {
          const sender = usersByIdRef.current[incoming.senderId];
          const senderName = sender ? sender.name : "New message";
          const toast = {
            id: incoming.id,
            title: senderName,
            body: incoming.text || "Sent an attachment",
            chatId: incoming.chatId,
          };
          setToasts(function (current) {
            return [toast, ...current].slice(0, 4);
          });
          if (Notification.permission === "granted") {
            new Notification("PingMe · " + senderName, {
              body: incoming.text || "Sent an attachment",
            });
          }
        }
      }
      return;
    }

    if (event.type === "message:deleted" && event.chatId && event.messageId) {
      const chatId = event.chatId;
      const messageId = event.messageId;
      setMessagesByChat(function (current) {
        const list = current[chatId] || [];
        const nextList = [];
        for (let i = 0; i < list.length; i += 1) {
          if (list[i].id !== messageId) {
            nextList.push(list[i]);
          }
        }
        return { ...current, [chatId]: nextList };
      });
      void refreshLists();
      return;
    }

    if (event.type === "error" && typeof event.message === "string") {
      setChatError(event.message);
    }
  }

  const handleSocketEventRef = useRef(handleSocketEvent);
  handleSocketEventRef.current = handleSocketEvent;

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    setLoadingChats(true);
    refreshLists()
      .catch(function (error: Error) {
        setChatError(error.message);
      })
      .finally(function () {
        setLoadingChats(false);
      });

    const socket = connectChatSocket({
      token,
      onEvent: function (event) {
        handleSocketEventRef.current(event);
      },
      onStatus: function (status) {
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

    return function () {
      socket.close();
      socketRef.current = null;
    };
  }, [token, user]);

  async function selectChat(chatId: string | null) {
    setActiveChatId(chatId);
    setReplyTo(null);
    setSearchResults([]);
    setChatError("");
    if (!chatId) {
      return;
    }

    const cached = messagesByChatRef.current[chatId];
    if (cached) {
      markVisibleRead(chatId, cached);
      return;
    }

    setLoadingMessages(true);
    try {
      const result = await messagesRequest(chatId);
      setMessagesByChat(function (current) {
        return { ...current, [chatId]: result.messages };
      });
      setHasMoreByChat(function (current) {
        return { ...current, [chatId]: result.hasMore };
      });
      markVisibleRead(chatId, result.messages);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Could not load messages.");
    } finally {
      setLoadingMessages(false);
    }
  }

  async function loadMore() {
    if (!activeChatId || loadingMore || !hasMoreByChat[activeChatId]) {
      return;
    }
    const current = messagesByChat[activeChatId] || [];
    const oldest = current[0];
    if (!oldest) {
      return;
    }
    setLoadingMore(true);
    try {
      const result = await messagesRequest(activeChatId, oldest.id);
      setMessagesByChat(function (existing) {
        const older = result.messages;
        const latest = existing[activeChatId] || [];
        return { ...existing, [activeChatId]: older.concat(latest) };
      });
      setHasMoreByChat(function (existing) {
        return { ...existing, [activeChatId]: result.hasMore };
      });
    } finally {
      setLoadingMore(false);
    }
  }

  function queueFailTimer(clientId: string, chatId: string) {
    failTimers.current[clientId] = window.setTimeout(function () {
      setMessagesByChat(function (current) {
        const list = current[chatId] || [];
        const nextList = [];
        for (let i = 0; i < list.length; i += 1) {
          const message = list[i];
          if (message.clientId === clientId) {
            nextList.push({ ...message, status: "failed" });
          } else {
            nextList.push(message);
          }
        }
        return { ...current, [chatId]: nextList };
      });
    }, FAIL_WAIT_MS);
  }

  async function sendOptimistic(text: string, attachments: Attachment[], retryOf?: Message) {
    if (!user || !activeChatId) {
      return;
    }

    const clientId = retryOf && retryOf.clientId ? retryOf.clientId : "temp-" + crypto.randomUUID();
    const optimistic: Message = {
      id: retryOf ? retryOf.id : clientId,
      chatId: activeChatId,
      senderId: user.id,
      text,
      createdAt: retryOf ? retryOf.createdAt : new Date().toISOString(),
      replyToId: retryOf ? retryOf.replyToId : replyTo ? replyTo.id : undefined,
      clientId,
      attachments,
      reactions: [],
      status: "sending",
      deliveredTo: [],
      readBy: [],
    };

    setMessagesByChat(function (current) {
      const list = current[activeChatId] || [];
      if (retryOf) {
        const nextList = [];
        for (let i = 0; i < list.length; i += 1) {
          if (list[i].clientId === clientId) {
            nextList.push(optimistic);
          } else {
            nextList.push(list[i]);
          }
        }
        return { ...current, [activeChatId]: nextList };
      }
      return { ...current, [activeChatId]: list.concat([optimistic]) };
    });
    setReplyTo(null);
    queueFailTimer(clientId, activeChatId);

    let sent = false;
    if (socketRef.current) {
      sent = socketRef.current.send({
        type: "message:send",
        chatId: activeChatId,
        text,
        replyToId: optimistic.replyToId,
        clientId,
        attachments,
      });
    }

    if (!sent) {
      setMessagesByChat(function (current) {
        const list = current[activeChatId] || [];
        const nextList = [];
        for (let i = 0; i < list.length; i += 1) {
          const message = list[i];
          if (message.clientId === clientId) {
            nextList.push({ ...message, status: "failed" });
          } else {
            nextList.push(message);
          }
        }
        return { ...current, [activeChatId]: nextList };
      });
    }
  }

  async function sendMessage(text: string, files: File[] = []) {
    if (!token || !activeChatId) {
      return;
    }
    if (!text.trim() && files.length === 0) {
      return;
    }

    const attachments: Attachment[] = [];
    try {
      for (let i = 0; i < files.length; i += 1) {
        setUploadProgress(0);
        const uploaded = await uploadFile(files[i], token, function (percent) {
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
  }

  async function retryMessage(message: Message) {
    await sendOptimistic(message.text, message.attachments, message);
  }

  let activeChat: Chat | null = null;
  for (let i = 0; i < chats.length; i += 1) {
    if (chats[i].id === activeChatId) {
      activeChat = chats[i];
    }
  }

  const value: ChatContextValue = {
    chats,
    users,
    usersById,
    activeChatId,
    activeChat,
    messages: activeChatId && messagesByChat[activeChatId] ? messagesByChat[activeChatId] : [],
    hasMore: activeChatId ? Boolean(hasMoreByChat[activeChatId]) : false,
    loadingChats,
    loadingMessages,
    loadingMore,
    chatError,
    connectionStatus,
    typingUserIds: activeChatId && typingByChat[activeChatId] ? typingByChat[activeChatId] : [],
    toasts,
    searchResults,
    searching,
    globalSearchResults,
    searchingGlobal,
    uploadProgress,
    replyTo,
    setReplyTo,
    selectChat,
    loadMore,
    sendMessage,
    retryMessage,
    editMessage(messageId, text) {
      if (socketRef.current) {
        socketRef.current.send({ type: "message:edit", messageId, text });
      }
    },
    deleteMessage(messageId) {
      if (socketRef.current) {
        socketRef.current.send({ type: "message:delete", messageId });
      }
    },
    reactToMessage(messageId, emoji) {
      if (socketRef.current) {
        socketRef.current.send({ type: "message:react", messageId, emoji });
      }
    },
    startTyping() {
      if (activeChatId && socketRef.current) {
        socketRef.current.send({ type: "typing:start", chatId: activeChatId });
      }
    },
    stopTyping() {
      if (activeChatId && socketRef.current) {
        socketRef.current.send({ type: "typing:stop", chatId: activeChatId });
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
    async searchAllChats(query) {
      const needle = query.trim();
      if (!needle) {
        setGlobalSearchResults([]);
        setSearchingGlobal(false);
        return;
      }
      setSearchingGlobal(true);
      try {
        const results = await searchAllMessagesRequest(needle);
        setGlobalSearchResults(results);
      } finally {
        setSearchingGlobal(false);
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
      setToasts(function (current) {
        const next = [];
        for (let i = 0; i < current.length; i += 1) {
          if (current[i].id !== id) {
            next.push(current[i]);
          }
        }
        return next;
      });
    },
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used inside ChatProvider");
  }
  return context;
}

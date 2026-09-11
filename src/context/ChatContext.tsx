// @refresh reset
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  addGroupMemberRequest,
  chatsRequest,
  createDirectChatRequest,
  createGroupChatRequest,
  messagesRequest,
  removeGroupMemberRequest,
  renameGroupRequest,
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
  pingChatId: string;
  pingKey: number;
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
  revealMessage: (chatId: string, messageId: string) => Promise<void>;
  highlightMessageId: string | null;
  highlightNonce: number;
  startDirectChat: (userId: string) => Promise<void>;
  startGroupChat: (name: string, memberIds: string[]) => Promise<void>;
  renameGroup: (name: string) => Promise<void>;
  addGroupMember: (userId: string) => Promise<void>;
  removeGroupMember: (userId: string) => Promise<void>;
  dismissToast: (id: string) => void;
};

export const ChatContext = createContext<ChatContextValue | null>(null);
const FAIL_WAIT_MS = 8000;
const TYPING_HIDE_MS = 1400;

function replaceOrAddMessage(list: Message[], incoming: Message, allowInsert: boolean) {
  const next = [];
  let replaced = false;

  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    const sameClient = incoming.clientId && item.clientId === incoming.clientId;
    const sameId = item.id === incoming.id;
    const incomingReadBy = incoming.readBy || [];
    const incomingDelivered = incoming.deliveredTo || [];
    if (sameClient || sameId) {
      if (item.status === "read" && incoming.status !== "read" && incoming.status !== "failed") {
        next.push({
          ...incoming,
          status: "read",
          readBy: incomingReadBy.length > 0 ? incomingReadBy : item.readBy || [],
          deliveredTo: incomingDelivered.length > 0 ? incomingDelivered : item.deliveredTo || [],
        });
      } else {
        next.push({
          ...incoming,
          readBy: incomingReadBy,
          deliveredTo: incomingDelivered,
          reactions: incoming.reactions || [],
          attachments: incoming.attachments || [],
        });
      }
      replaced = true;
    } else if (
      incoming.status === "read" &&
      item.senderId === incoming.senderId &&
      item.createdAt <= incoming.createdAt &&
      item.status !== "read" &&
      item.status !== "failed"
    ) {
      next.push({
        ...item,
        status: "read",
        readBy: incomingReadBy,
        deliveredTo: incomingDelivered,
      });
    } else {
      next.push(item);
    }
  }

  if (!replaced && allowInsert) {
    next.push(incoming);
  }

  return next;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, token, applyUser } = useAuth();
  const socketRef = useRef<ReturnType<typeof connectChatSocket> | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const messagesByChatRef = useRef<{ [chatId: string]: Message[] }>({});
  const hasMoreByChatRef = useRef<{ [chatId: string]: boolean }>({});
  const userRef = useRef(user);
  const usersByIdRef = useRef<{ [id: string]: User }>({});
  const failTimers = useRef<{ [id: string]: number }>({});
  const pingTimer = useRef(0);
  const typingHideTimers = useRef<{ [key: string]: number }>({});

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
  const [pingChatId, setPingChatId] = useState("");
  const [pingKey, setPingKey] = useState(0);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState<Message[]>([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const [highlightNonce, setHighlightNonce] = useState(0);

  activeChatIdRef.current = activeChatId;
  messagesByChatRef.current = messagesByChat;
  hasMoreByChatRef.current = hasMoreByChat;
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

  function typingKey(chatId: string, userId: string) {
    return chatId + ":" + userId;
  }

  function clearTypingHideTimer(chatId: string, userId: string) {
    const key = typingKey(chatId, userId);
    if (typingHideTimers.current[key]) {
      window.clearTimeout(typingHideTimers.current[key]);
      delete typingHideTimers.current[key];
    }
  }

  function showTyping(chatId: string, userId: string) {
    clearTypingHideTimer(chatId, userId);
    setTypingByChat(function (current) {
      const existing = current[chatId] || [];
      if (existing.includes(userId)) {
        return current;
      }
      const nextIds = existing.slice();
      nextIds.push(userId);
      return { ...current, [chatId]: nextIds };
    });
  }

  function hideTyping(chatId: string, userId: string) {
    clearTypingHideTimer(chatId, userId);
    setTypingByChat(function (current) {
      const existing = current[chatId] || [];
      const nextIds = [];
      for (let i = 0; i < existing.length; i += 1) {
        if (existing[i] !== userId) {
          nextIds.push(existing[i]);
        }
      }
      return { ...current, [chatId]: nextIds };
    });
  }

  function hideTypingSoon(chatId: string, userId: string) {
    clearTypingHideTimer(chatId, userId);
    const key = typingKey(chatId, userId);
    typingHideTimers.current[key] = window.setTimeout(function () {
      hideTyping(chatId, userId);
    }, TYPING_HIDE_MS);
  }

  function markVisibleRead(chatId: string, list: Message[]) {
    const currentUser = userRef.current;
    if (!currentUser) {
      return;
    }

    const unreadIds: string[] = [];
    for (let i = 0; i < list.length; i += 1) {
      const message = list[i];
      const readBy = message.readBy || [];
      if (
        message.kind === "system" ||
        message.senderId === "system" ||
        message.senderId === currentUser.id ||
        readBy.includes(currentUser.id)
      ) {
        continue;
      }
      unreadIds.push(message.id);
    }

    if (unreadIds.length === 0 && list.length === 0) {
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

  function upsertChat(incoming: Chat) {
    setChats(function (current) {
      const next = [];
      let exists = false;
      for (let i = 0; i < current.length; i += 1) {
        const chat = current[i];
        if (chat.id === incoming.id) {
          exists = true;
          next.push({ ...chat, ...incoming });
        } else {
          next.push(chat);
        }
      }
      if (!exists) {
        next.push(incoming);
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
  }

  function handleSocketEvent(event: SocketEvent) {
    const currentUser = userRef.current;

    if (event.type === "user:updated" && event.user) {
      const updated = event.user;
      applyUser(updated);
      setUsers(function (current) {
        const next = [];
        let found = false;
        for (let i = 0; i < current.length; i += 1) {
          const person = current[i];
          if (person.id === updated.id) {
            found = true;
            next.push(updated);
          } else {
            next.push(person);
          }
        }
        if (!found && (!currentUser || currentUser.id !== updated.id)) {
          next.push(updated);
        }
        return next;
      });
      return;
    }

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
      if (event.isTyping) {
        showTyping(event.chatId, event.userId);
      } else {
        hideTypingSoon(event.chatId, event.userId);
      }
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

    if (event.type === "chat:updated" && event.chat) {
      upsertChat(event.chat);
      return;
    }

    if (event.type === "chat:removed" && event.chatId) {
      const removedId = event.chatId;
      setChats(function (current) {
        const next = [];
        for (let i = 0; i < current.length; i += 1) {
          if (current[i].id !== removedId) {
            next.push(current[i]);
          }
        }
        return next;
      });
      setMessagesByChat(function (current) {
        const next = { ...current };
        delete next[removedId];
        return next;
      });
      if (activeChatIdRef.current === removedId) {
        setActiveChatId(null);
        setReplyTo(null);
      }
      return;
    }

    if ((event.type === "message:new" || event.type === "message:updated") && event.message && typeof event.message !== "string") {
      const incoming = event.message;
      hideTyping(incoming.chatId, incoming.senderId);
      const timerKey = incoming.clientId || incoming.id;
      if (failTimers.current[timerKey]) {
        window.clearTimeout(failTimers.current[timerKey]);
        delete failTimers.current[timerKey];
      }

      setMessagesByChat(function (current) {
        const list = current[incoming.chatId] || [];
        return {
          ...current,
          [incoming.chatId]: replaceOrAddMessage(list, incoming, event.type === "message:new"),
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
            const isSystem = incoming.kind === "system" || incoming.senderId === "system";
            const isIncoming =
              currentUser && incoming.senderId !== currentUser.id && event.type === "message:new" && !isSystem;
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
        const isSystem = incoming.kind === "system" || incoming.senderId === "system";
        if (viewing) {
          markVisibleRead(incoming.chatId, [incoming]);
        } else if (!isSystem) {
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
          setPingChatId(incoming.chatId);
          setPingKey(Date.now());
          if (pingTimer.current) {
            window.clearTimeout(pingTimer.current);
          }
          pingTimer.current = window.setTimeout(function () {
            setPingChatId("");
          }, 2200);
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
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

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }

    return function () {
      socket.close();
      socketRef.current = null;
      const keys = Object.keys(typingHideTimers.current);
      for (let i = 0; i < keys.length; i += 1) {
        window.clearTimeout(typingHideTimers.current[keys[i]]);
      }
      typingHideTimers.current = {};
    };
  }, [token, user]);

  async function selectChat(chatId: string | null) {
    setActiveChatId(chatId);
    setReplyTo(null);
    setSearchResults([]);
    setChatError("");
    setPingChatId("");
    setHighlightMessageId(null);
    if (!chatId) {
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
      messagesByChatRef.current = { ...messagesByChatRef.current, [chatId]: result.messages };
      hasMoreByChatRef.current = { ...hasMoreByChatRef.current, [chatId]: result.hasMore };
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

  function listHasMessage(chatId: string, messageId: string) {
    const list = messagesByChatRef.current[chatId] || [];
    for (let i = 0; i < list.length; i += 1) {
      if (list[i].id === messageId) {
        return true;
      }
    }
    return false;
  }

  async function ensureMessageLoaded(chatId: string, messageId: string) {
    let guard = 0;
    while (!listHasMessage(chatId, messageId) && hasMoreByChatRef.current[chatId] && guard < 40) {
      const current = messagesByChatRef.current[chatId] || [];
      const oldest = current[0];
      if (!oldest) {
        return;
      }
      setLoadingMore(true);
      try {
        const result = await messagesRequest(chatId, oldest.id);
        const nextList = result.messages.concat(current);
        messagesByChatRef.current = { ...messagesByChatRef.current, [chatId]: nextList };
        hasMoreByChatRef.current = { ...hasMoreByChatRef.current, [chatId]: result.hasMore };
        setMessagesByChat(function (existing) {
          return { ...existing, [chatId]: nextList };
        });
        setHasMoreByChat(function (existing) {
          return { ...existing, [chatId]: result.hasMore };
        });
      } finally {
        setLoadingMore(false);
      }
      guard += 1;
    }
  }

  async function revealMessage(chatId: string, messageId: string) {
    if (activeChatIdRef.current !== chatId) {
      await selectChat(chatId);
    }
    setHighlightMessageId(messageId);
    setHighlightNonce(Date.now());
    await ensureMessageLoaded(chatId, messageId);
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
    pingChatId,
    pingKey,
    searchResults,
    searching,
    globalSearchResults,
    searchingGlobal,
    uploadProgress,
    replyTo,
    setReplyTo,
    revealMessage,
    highlightMessageId,
    highlightNonce,
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
    async renameGroup(name) {
      if (!activeChatId) {
        return;
      }
      const result = await renameGroupRequest(activeChatId, name);
      upsertChat(result.chat);
      handleSocketEventRef.current({ type: "message:new", message: result.message });
    },
    async addGroupMember(userId) {
      if (!activeChatId) {
        return;
      }
      const result = await addGroupMemberRequest(activeChatId, userId);
      upsertChat(result.chat);
      handleSocketEventRef.current({ type: "message:new", message: result.message });
    },
    async removeGroupMember(userId) {
      if (!activeChatId) {
        return;
      }
      const result = await removeGroupMemberRequest(activeChatId, userId);
      upsertChat(result.chat);
      handleSocketEventRef.current({ type: "message:new", message: result.message });
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

export type ChatType = "direct" | "group";

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export type AttachmentKind = "image" | "document";

export type ConnectionStatus = "connecting" | "connected" | "offline";

export type User = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  online: boolean;
  lastSeen: string;
};

export type Attachment = {
  id: string;
  name: string;
  url: string;
  kind: AttachmentKind;
  size: number;
};

export type Reaction = {
  emoji: string;
  userId: string;
};

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  replyToId?: string;
  clientId?: string;
  attachments: Attachment[];
  reactions: Reaction[];
  status: MessageStatus;
  deliveredTo: string[];
  readBy: string[];
};

export type Chat = {
  id: string;
  type: ChatType;
  name: string;
  memberIds: string[];
  adminIds: string[];
  createdAt: string;
  lastMessage?: Message;
  unreadCount: number;
};

export type TypingUser = {
  chatId: string;
  userId: string;
};

export type ToastItem = {
  id: string;
  title: string;
  body: string;
  chatId: string;
};

export type ClientEvent =
  | { type: "auth"; token: string }
  | {
      type: "message:send";
      chatId: string;
      text: string;
      replyToId?: string;
      clientId: string;
      attachments?: Attachment[];
    }
  | { type: "message:edit"; messageId: string; text: string }
  | { type: "message:delete"; messageId: string }
  | { type: "message:react"; messageId: string; emoji: string }
  | { type: "message:read"; chatId: string; messageIds: string[] }
  | { type: "typing:start"; chatId: string }
  | { type: "typing:stop"; chatId: string }
  | { type: "ping" };

export type ServerEvent =
  | { type: "auth:ok"; user: User }
  | { type: "auth:error"; message: string }
  | { type: "message:new"; message: Message }
  | { type: "message:updated"; message: Message }
  | { type: "message:deleted"; chatId: string; messageId: string }
  | { type: "typing"; chatId: string; userId: string; isTyping: boolean }
  | { type: "presence"; userId: string; online: boolean; lastSeen: string }
  | { type: "unread"; chatId: string; count: number }
  | { type: "pong" }
  | { type: "error"; message: string };

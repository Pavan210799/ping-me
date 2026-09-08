export type ChatType = "direct" | "group";
export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";
export type AttachmentKind = "image" | "document";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarColor: string;
  lastSeen: string;
};

export type PublicUser = {
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

export type MessageRecord = {
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

export type ChatRecord = {
  id: string;
  type: ChatType;
  name: string;
  memberIds: string[];
  adminIds: string[];
  createdAt: string;
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

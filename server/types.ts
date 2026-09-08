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
  kind: string;
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
  status: string;
  deliveredTo: string[];
  readBy: string[];
};

export type ChatRecord = {
  id: string;
  type: string;
  name: string;
  memberIds: string[];
  adminIds: string[];
  createdAt: string;
};

export type SocketEvent = {
  type: string;
  token?: string;
  chatId?: string;
  text?: string;
  replyToId?: string;
  clientId?: string;
  attachments?: Attachment[];
  messageId?: string;
  messageIds?: string[];
  emoji?: string;
};

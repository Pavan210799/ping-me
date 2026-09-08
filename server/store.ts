import bcrypt from "bcryptjs";
import type {
  ChatRecord,
  MessageRecord,
  PublicUser,
  UserRecord,
} from "./types.ts";

const DEMO_PASSWORD = "123456";
const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 8);

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

const users: UserRecord[] = [
  {
    id: "user-pavan",
    name: "Pavan",
    email: "pavan@gmail.com",
    passwordHash,
    avatarColor: "#d95d39",
    lastSeen: new Date().toISOString(),
  },
  {
    id: "user-sagi",
    name: "Sagi",
    email: "sagi@gmail.com",
    passwordHash,
    avatarColor: "#5c8f7a",
    lastSeen: hoursAgo(1),
  },
  {
    id: "user-kumar",
    name: "Kumar",
    email: "kumar@gmail.com",
    passwordHash,
    avatarColor: "#3d8fd4",
    lastSeen: minutesAgo(18),
  },
  {
    id: "user-rahul",
    name: "Rahul",
    email: "rahul@gmail.com",
    passwordHash,
    avatarColor: "#c4784a",
    lastSeen: hoursAgo(4),
  },
  {
    id: "user-akhil",
    name: "Akhil",
    email: "akhil@gmail.com",
    passwordHash,
    avatarColor: "#8c6a4f",
    lastSeen: hoursAgo(9),
  },
  {
    id: "user-vishnu",
    name: "Vishnu",
    email: "vishnu@gmail.com",
    passwordHash,
    avatarColor: "#6b7fd4",
    lastSeen: hoursAgo(6),
  },
];

const chats: ChatRecord[] = [
  {
    id: "chat-pavan-kumar",
    type: "direct",
    name: "",
    memberIds: ["user-pavan", "user-kumar"],
    adminIds: ["user-pavan", "user-kumar"],
    createdAt: hoursAgo(72),
  },
  {
    id: "chat-pavan-sagi",
    type: "direct",
    name: "",
    memberIds: ["user-pavan", "user-sagi"],
    adminIds: ["user-pavan", "user-sagi"],
    createdAt: hoursAgo(40),
  },
  {
    id: "chat-squad",
    type: "group",
    name: "my group",
    memberIds: ["user-pavan", "user-sagi", "user-kumar"],
    adminIds: ["user-pavan"],
    createdAt: hoursAgo(36),
  },
];

function makeMessage(
  id: string,
  chatId: string,
  senderId: string,
  text: string,
  createdAt: string,
  extra: Partial<MessageRecord> = {},
): MessageRecord {
  return {
    id,
    chatId,
    senderId,
    text,
    createdAt,
    attachments: [],
    reactions: [],
    status: "read",
    deliveredTo: chats
      .find((chat) => chat.id === chatId)
      ?.memberIds.filter((memberId) => memberId !== senderId) ?? [],
    readBy: chats
      .find((chat) => chat.id === chatId)
      ?.memberIds.filter((memberId) => memberId !== senderId) ?? [],
    ...extra,
  };
}

const kumarThread: { sender: "user-pavan" | "user-kumar"; text: string }[] = [
  { sender: "user-kumar", text: "Pavan, did you push the PingMe auth screens?" },
  { sender: "user-pavan", text: "Not yet. Finishing the login card first." },
  { sender: "user-kumar", text: "Cool. Keep the terracotta button, it looks premium." },
  { sender: "user-pavan", text: "Agreed. Cream background + terracotta send bubble." },
  { sender: "user-kumar", text: "Can we seed a long thread so pagination is obvious?" },
  { sender: "user-pavan", text: "Yes — this chat will have a lot of older messages." },
  { sender: "user-kumar", text: "Perfect. Reviewers can scroll up and load earlier ones." },
  { sender: "user-pavan", text: "Limit is 12 per page. Older messages stay on the server." },
  { sender: "user-kumar", text: "Also add a load-earlier hint at the top." },
  { sender: "user-pavan", text: "On it. Intersection observer + a button." },
  { sender: "user-kumar", text: "Sagi asked if group chat is ready." },
  { sender: "user-pavan", text: "The squad group is seeded. He can jump in there." },
  { sender: "user-kumar", text: "Rahul, Akhil, and Vishnu should exist too, right?" },
  { sender: "user-pavan", text: "Yes, for New Chat. No history with them yet." },
  { sender: "user-kumar", text: "Password is 123456 for every demo account?" },
  { sender: "user-pavan", text: "Correct. Easy to type during the review." },
  { sender: "user-kumar", text: "Add an eye toggle on the password field." },
  { sender: "user-pavan", text: "Doing that next so the demo login is clearer." },
  { sender: "user-kumar", text: "Reactions should replace, not stack, for one user." },
  { sender: "user-pavan", text: "If I tap ❤️ after 👍, only the heart stays." },
  { sender: "user-kumar", text: "Five options is enough. Don’t crowd the bubble." },
  { sender: "user-pavan", text: "👍 ❤️ 😂 😮 🎉 — that’s the set." },
  { sender: "user-kumar", text: "Animate the reaction so it pops." },
  { sender: "user-pavan", text: "Pop + a little float. Hover scale on the picker too." },
  { sender: "user-kumar", text: "Chat canvas feels flat. Can we add a pattern?" },
  { sender: "user-pavan", text: "Warm paper texture with faint ping marks." },
  { sender: "user-kumar", text: "Auth pages need a theme-aware moving background." },
  { sender: "user-pavan", text: "Light orbs for cream, ember glow for dark mode." },
  { sender: "user-kumar", text: "Logo should sit on transparent, no cream tile." },
  { sender: "user-pavan", text: "Switched it to an SVG so the bubble is the mark." },
  { sender: "user-kumar", text: "I’m around if you want a second browser for live tests." },
  { sender: "user-pavan", text: "Yes — log in as kumar@gmail.com in a private window." },
  { sender: "user-kumar", text: "Typing indicators still feel good?" },
  { sender: "user-pavan", text: "They do. The bounce dots match the accent." },
  { sender: "user-kumar", text: "Last thing: open this thread when Pavan signs in." },
  { sender: "user-pavan", text: "Done. You’ll see this history immediately after login." },
  { sender: "user-kumar", text: "Scroll up from here to pull the older pages." },
  { sender: "user-pavan", text: "This is the latest message. Older ones are above." },
  { sender: "user-kumar", text: "Pavan, can you also check the unread badge on Sagi?" },
  { sender: "user-pavan", text: "Yes, it should show 1 until I open that chat." },
  { sender: "user-kumar", text: "Nice. I’m sending a few more notes so the thread stays long." },
  { sender: "user-pavan", text: "Keep going — pagination only loads 8 at a time." },
  { sender: "user-kumar", text: "Morning standup is at 10. Want me to cover the chat demo?" },
  { sender: "user-pavan", text: "Please. I’ll join from the other room." },
  { sender: "user-kumar", text: "Bring the Kumar thread on screen first. It shows history well." },
  { sender: "user-pavan", text: "That’s the plan. Sign in as Pavan and this chat opens." },
  { sender: "user-kumar", text: "If reviewers scroll up they should see Load earlier messages." },
  { sender: "user-pavan", text: "Exactly. Newest lines stay at the bottom." },
];

const messages: MessageRecord[] = [
  ...kumarThread.map((line, index) =>
    makeMessage(
      `msg-kumar-${index + 1}`,
      "chat-pavan-kumar",
      line.sender,
      line.text,
      index < 20 ? hoursAgo(30 - index * 0.6) : minutesAgo((kumarThread.length - index) * 5),
      index === kumarThread.length - 3
        ? { reactions: [{ emoji: "👍", userId: "user-pavan" }] }
        : index === kumarThread.length - 1
          ? { status: "delivered", readBy: [], deliveredTo: ["user-kumar"] }
          : {},
    ),
  ),
  makeMessage(
    "msg-sagi-1",
    "chat-pavan-sagi",
    "user-sagi",
    "Pavan, logo looks cleaner without the cream square.",
    hoursAgo(6),
    { reactions: [{ emoji: "🎉", userId: "user-pavan" }] },
  ),
  makeMessage(
    "msg-sagi-2",
    "chat-pavan-sagi",
    "user-pavan",
    "Thanks. It’s an SVG now so it works on any background.",
    hoursAgo(5.5),
  ),
  makeMessage(
    "msg-sagi-3",
    "chat-pavan-sagi",
    "user-sagi",
    "Want me to test dark mode on the auth orbs?",
    hoursAgo(5),
  ),
  makeMessage(
    "msg-sagi-4",
    "chat-pavan-sagi",
    "user-pavan",
    "Yes please. Toggle the sun/moon on the login screen.",
    hoursAgo(4.7),
  ),
  makeMessage(
    "msg-sagi-5",
    "chat-pavan-sagi",
    "user-sagi",
    "Looks great. Catch you in the squad group.",
    minutesAgo(50),
    { status: "delivered", readBy: [], deliveredTo: ["user-pavan"] },
  ),
  makeMessage(
    "msg-squad-1",
    "chat-squad",
    "user-sagi",
    "Squad chat is live. Drop updates here.",
    hoursAgo(8),
  ),
  makeMessage(
    "msg-squad-2",
    "chat-squad",
    "user-kumar",
    "I’ll review the Kumar thread pagination tonight.",
    hoursAgo(7),
  ),
  makeMessage(
    "msg-squad-3",
    "chat-squad",
    "user-pavan",
    "Sounds good. Rahul and the others can be added later.",
    hoursAgo(6.5),
    { replyToId: "msg-squad-1", reactions: [{ emoji: "❤️", userId: "user-sagi" }] },
  ),
  makeMessage(
    "msg-squad-4",
    "chat-squad",
    "user-sagi",
    "Rahul, Akhil, Vishnu are in the directory if we need them.",
    minutesAgo(80),
  ),
];

for (const user of users) {
  for (const message of messages) {
    if (message.senderId === user.id && message.createdAt > user.lastSeen) {
      user.lastSeen = message.createdAt;
    }
  }
}

const lastReadAt: Record<string, Record<string, string>> = {
  "user-pavan": {
    "chat-pavan-kumar": minutesAgo(8),
    "chat-pavan-sagi": hoursAgo(5),
    "chat-squad": hoursAgo(6),
  },
  "user-sagi": {
    "chat-pavan-sagi": minutesAgo(50),
    "chat-squad": minutesAgo(80),
  },
  "user-kumar": {
    "chat-pavan-kumar": minutesAgo(20),
    "chat-squad": hoursAgo(7),
  },
};

const onlineUserIds = new Set<string>();

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor,
    online: onlineUserIds.has(user.id),
    lastSeen: user.lastSeen,
  };
}

export function findUserByEmail(email: string): UserRecord | undefined {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): UserRecord | undefined {
  return users.find((user) => user.id === id);
}

export function listPublicUsers(): PublicUser[] {
  return users.map(toPublicUser);
}

export function createUser(name: string, email: string, password: string): UserRecord {
  const user: UserRecord = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 8),
    avatarColor: ["#d95d39", "#5c8f7a", "#3d8fd4", "#c4784a"][users.length % 4],
    lastSeen: new Date().toISOString(),
  };
  users.push(user);
  lastReadAt[user.id] = {};
  return user;
}

export function updatePassword(email: string, password: string): UserRecord {
  const user = findUserByEmail(email);
  if (!user) {
    throw new Error("No account found for that email.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  user.passwordHash = bcrypt.hashSync(password, 8);
  return user;
}

export function setUserOnline(userId: string, online: boolean): void {
  const user = findUserById(userId);
  if (!user) {
    return;
  }
  if (online) {
    onlineUserIds.add(userId);
  } else {
    onlineUserIds.delete(userId);
    user.lastSeen = new Date().toISOString();
  }
}

export function isUserOnline(userId: string): boolean {
  return onlineUserIds.has(userId);
}

export function listChatsForUser(userId: string): ChatRecord[] {
  return chats.filter((chat) => chat.memberIds.includes(userId));
}

export function findChatById(chatId: string): ChatRecord | undefined {
  return chats.find((chat) => chat.id === chatId);
}

export function findDirectChat(userA: string, userB: string): ChatRecord | undefined {
  return chats.find((chat) => {
    if (chat.type !== "direct" || chat.memberIds.length !== 2) {
      return false;
    }
    return chat.memberIds.includes(userA) && chat.memberIds.includes(userB);
  });
}

export function createDirectChat(userA: string, userB: string): ChatRecord {
  const existing = findDirectChat(userA, userB);
  if (existing) {
    return existing;
  }

  const chat: ChatRecord = {
    id: crypto.randomUUID(),
    type: "direct",
    name: "",
    memberIds: [userA, userB],
    adminIds: [userA, userB],
    createdAt: new Date().toISOString(),
  };
  chats.push(chat);
  return chat;
}

export function createGroupChat(
  name: string,
  memberIds: string[],
  adminId: string,
): ChatRecord {
  const uniqueMembers = Array.from(new Set([adminId, ...memberIds]));
  const chat: ChatRecord = {
    id: crypto.randomUUID(),
    type: "group",
    name: name.trim(),
    memberIds: uniqueMembers,
    adminIds: [adminId],
    createdAt: new Date().toISOString(),
  };
  chats.push(chat);
  return chat;
}

export function listMessages(
  chatId: string,
  limit: number,
  beforeId?: string,
): { messages: MessageRecord[]; hasMore: boolean } {
  const all = messages
    .filter((message) => message.chatId === chatId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  let end = all.length;
  if (beforeId) {
    const index = all.findIndex((message) => message.id === beforeId);
    if (index >= 0) {
      end = index;
    }
  }

  const start = Math.max(0, end - limit);
  return {
    messages: all.slice(start, end),
    hasMore: start > 0,
  };
}

export function searchMessages(chatId: string, query: string): MessageRecord[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [];
  }
  return messages.filter((message) => {
    return (
      message.chatId === chatId &&
      !message.deletedAt &&
      message.text.toLowerCase().includes(needle)
    );
  });
}

export function searchAllMessages(userId: string, query: string): MessageRecord[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [];
  }

  const myChats = listChatsForUser(userId);
  const chatIds: { [id: string]: boolean } = {};
  for (let i = 0; i < myChats.length; i += 1) {
    chatIds[myChats[i].id] = true;
  }

  const matches: MessageRecord[] = [];
  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];
    if (!chatIds[message.chatId] || message.deletedAt) {
      continue;
    }
    if (!message.text.toLowerCase().includes(needle)) {
      continue;
    }
    matches.push(message);
  }

  matches.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return matches.slice(0, 40);
}

export function findMessageById(messageId: string): MessageRecord | undefined {
  return messages.find((message) => message.id === messageId);
}

export function addMessage(message: MessageRecord): MessageRecord {
  messages.push(message);
  return message;
}

export function removeMessage(messageId: string): MessageRecord | undefined {
  const index = messages.findIndex((message) => message.id === messageId);
  if (index < 0) {
    return undefined;
  }
  const [removed] = messages.splice(index, 1);
  return removed;
}

export function getLastMessage(chatId: string): MessageRecord | undefined {
  const chatMessages = messages
    .filter((message) => message.chatId === chatId && !message.deletedAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return chatMessages[chatMessages.length - 1];
}

export function getUnreadCount(userId: string, chatId: string): number {
  const readAt = lastReadAt[userId]?.[chatId] ?? "1970-01-01T00:00:00.000Z";
  return messages.filter((message) => {
    return (
      message.chatId === chatId &&
      message.senderId !== userId &&
      !message.deletedAt &&
      message.createdAt > readAt
    );
  }).length;
}

export function markChatRead(userId: string, chatId: string, messageIds: string[]): void {
  if (!lastReadAt[userId]) {
    lastReadAt[userId] = {};
  }
  lastReadAt[userId][chatId] = new Date().toISOString();

  for (const messageId of messageIds) {
    const message = findMessageById(messageId);
    if (!message || message.senderId === userId) {
      continue;
    }
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
    }
    if (!message.deliveredTo.includes(userId)) {
      message.deliveredTo.push(userId);
    }
    refreshMessageStatus(message);
  }
}

export function markDelivered(userId: string, chatId: string): MessageRecord[] {
  const updated: MessageRecord[] = [];
  for (const message of messages) {
    if (message.chatId !== chatId || message.senderId === userId) {
      continue;
    }
    if (!message.deliveredTo.includes(userId)) {
      message.deliveredTo.push(userId);
      refreshMessageStatus(message);
      updated.push(message);
    }
  }
  return updated;
}

export function refreshMessageStatus(message: MessageRecord): void {
  const chat = findChatById(message.chatId);
  if (!chat) {
    return;
  }

  const others = chat.memberIds.filter((id) => id !== message.senderId);
  const allRead = others.length > 0 && others.every((id) => message.readBy.includes(id));
  const anyDelivered = message.deliveredTo.length > 0;

  if (allRead) {
    message.status = "read";
  } else if (anyDelivered) {
    message.status = "delivered";
  } else if (message.status !== "sending" && message.status !== "failed") {
    message.status = "sent";
  }
}

export const demoPassword = DEMO_PASSWORD;

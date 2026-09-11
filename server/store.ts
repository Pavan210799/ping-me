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
    avatarUrl: "",
    lastSeen: new Date().toISOString(),
  },
  {
    id: "user-sagi",
    name: "Sagi",
    email: "sagi@gmail.com",
    passwordHash,
    avatarColor: "#5c8f7a",
    avatarUrl: "",
    lastSeen: hoursAgo(1),
  },
  {
    id: "user-kumar",
    name: "Kumar",
    email: "kumar@gmail.com",
    passwordHash,
    avatarColor: "#3d8fd4",
    avatarUrl: "",
    lastSeen: minutesAgo(18),
  },
  {
    id: "user-rahul",
    name: "Rahul",
    email: "rahul@gmail.com",
    passwordHash,
    avatarColor: "#c4784a",
    avatarUrl: "",
    lastSeen: hoursAgo(4),
  },
  {
    id: "user-akhil",
    name: "Akhil",
    email: "akhil@gmail.com",
    passwordHash,
    avatarColor: "#8c6a4f",
    avatarUrl: "",
    lastSeen: hoursAgo(9),
  },
  {
    id: "user-vishnu",
    name: "Vishnu",
    email: "vishnu@gmail.com",
    passwordHash,
    avatarColor: "#6b7fd4",
    avatarUrl: "",
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
    createdAt: hoursAgo(10),
  },
  {
    id: "chat-pavan-sagi",
    type: "direct",
    name: "",
    memberIds: ["user-pavan", "user-sagi"],
    adminIds: ["user-pavan", "user-sagi"],
    createdAt: hoursAgo(6),
  },
  {
    id: "chat-my-group",
    type: "group",
    name: "My Group",
    memberIds: ["user-pavan", "user-sagi", "user-kumar", "user-rahul", "user-akhil"],
    adminIds: ["user-pavan"],
    createdAt: hoursAgo(8),
  },
];

function membersExcept(chatId: string, senderId: string): string[] {
  const chat = chats.find((item) => item.id === chatId);
  if (!chat) {
    return [];
  }
  const others: string[] = [];
  for (let i = 0; i < chat.memberIds.length; i += 1) {
    if (chat.memberIds[i] !== senderId) {
      others.push(chat.memberIds[i]);
    }
  }
  return others;
}

function seedChatMessage(
  id: string,
  chatId: string,
  senderId: string,
  text: string,
  createdAt: string,
): MessageRecord {
  const others = membersExcept(chatId, senderId);
  return {
    id,
    chatId,
    senderId,
    text,
    createdAt,
    attachments: [],
    reactions: [],
    status: "read",
    deliveredTo: others.slice(),
    readBy: others.slice(),
  };
}

function seedSystemMessage(
  id: string,
  chatId: string,
  text: string,
  createdAt: string,
): MessageRecord {
  return {
    id,
    chatId,
    senderId: "system",
    text,
    createdAt,
    kind: "system",
    attachments: [],
    reactions: [],
    status: "sent",
    deliveredTo: [],
    readBy: [],
  };
}

function formatNameList(names: string[]): string {
  if (names.length === 0) {
    return "";
  }
  if (names.length === 1) {
    return names[0];
  }
  if (names.length === 2) {
    return names[0] + " and " + names[1];
  }
  return names.slice(0, names.length - 1).join(", ") + " and " + names[names.length - 1];
}

function seedThread(
  chatId: string,
  prefix: string,
  lines: { senderId: string; text: string }[],
  gapMinutes: number,
): MessageRecord[] {
  const result: MessageRecord[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    result.push(
      seedChatMessage(
        prefix + (i + 1),
        chatId,
        lines[i].senderId,
        lines[i].text,
        minutesAgo((lines.length - i) * gapMinutes),
      ),
    );
  }
  return result;
}

const pavanKumarLines = [
  { senderId: "user-kumar", text: "Hey Pavan" },
  { senderId: "user-pavan", text: "Hey Kumar, whats up?" },
  { senderId: "user-kumar", text: "All good. Did you check the latest PingMe build?" },
  { senderId: "user-pavan", text: "Yeah, I opened it a while ago." },
  { senderId: "user-kumar", text: "How does the sidebar feel on mobile?" },
  { senderId: "user-pavan", text: "Pretty clean. Profile card at the bottom looks nice." },
  { senderId: "user-kumar", text: "Nice. I liked the toasts too." },
  { senderId: "user-pavan", text: "They sit above the profile now, right side." },
  { senderId: "user-kumar", text: "Can you try a long message once?" },
  { senderId: "user-pavan", text: "This one should wrap, and in a toast it should cut with an ellipsis at the end." },
  { senderId: "user-kumar", text: "Perfect. Blue ticks showed on my side after you opened the chat." },
  { senderId: "user-pavan", text: "Good. Typing bubble should linger a second after you pause." },
  { senderId: "user-kumar", text: "I noticed that. Feels more natural." },
  { senderId: "user-pavan", text: "Are you joining My Group later?" },
  { senderId: "user-kumar", text: "Already in it. Sagi, Rahul, and Akhil are there too." },
  { senderId: "user-pavan", text: "Cool. I will drop a note there." },
  { senderId: "user-kumar", text: "Did you eat yet?" },
  { senderId: "user-pavan", text: "Not yet. Maybe after this." },
  { senderId: "user-kumar", text: "Same. I have one more review to finish." },
  { senderId: "user-pavan", text: "Take your time." },
  { senderId: "user-kumar", text: "Also, search in the sidebar is decent." },
  { senderId: "user-pavan", text: "People first, then chats. That order is better." },
  { senderId: "user-kumar", text: "Agreed." },
  { senderId: "user-pavan", text: "I still need to try Vishnu as a new chat." },
  { senderId: "user-kumar", text: "Leave him out so new chat is easy to demo." },
  { senderId: "user-pavan", text: "That was the plan." },
  { senderId: "user-kumar", text: "Scroll this thread a bit. It should be long enough now." },
  { senderId: "user-pavan", text: "Yup, I can load earlier messages from the top." },
  { senderId: "user-kumar", text: "There is a short wait so the loading label shows." },
  { senderId: "user-pavan", text: "Saw it. Loading earlier messages..." },
  { senderId: "user-kumar", text: "Great." },
  { senderId: "user-pavan", text: "Reactions still feel like Instagram?" },
  { senderId: "user-kumar", text: "Yeah, the heart and laugh look right." },
  { senderId: "user-pavan", text: "I will keep them." },
  { senderId: "user-kumar", text: "Dark mode toggle is in the header." },
  { senderId: "user-pavan", text: "Square button, icon rotates on hover." },
  { senderId: "user-kumar", text: "Small thing but it looks polished." },
  { senderId: "user-pavan", text: "Thanks." },
  { senderId: "user-kumar", text: "If the mentor asks, seeded users all use 123456." },
  { senderId: "user-pavan", text: "I know. pavan@gmail.com is fine even with capital P." },
  { senderId: "user-kumar", text: "Do not type gamil though." },
  { senderId: "user-pavan", text: "Haha noted." },
  { senderId: "user-kumar", text: "I am around if you want to test typing from two windows." },
  { senderId: "user-pavan", text: "Maybe in a bit." },
  { senderId: "user-kumar", text: "Okay." },
  { senderId: "user-pavan", text: "Did Sagi message you?" },
  { senderId: "user-kumar", text: "Only in the group. He chats with you 1-1." },
  { senderId: "user-pavan", text: "Right." },
  { senderId: "user-kumar", text: "Ping me when you are free." },
  { senderId: "user-pavan", text: "Will do." },
  { senderId: "user-kumar", text: "Later." },
  { senderId: "user-pavan", text: "Later Kumar." },
];

const pavanSagiLines = [
  { senderId: "user-sagi", text: "Pavan, did you push the latest UI?" },
  { senderId: "user-pavan", text: "Yes, the chat page is up. Take a look when you can." },
  { senderId: "user-sagi", text: "Looks clean. The cream background feels nicer." },
  { senderId: "user-pavan", text: "Thanks. I will tweak a few small things later." },
  { senderId: "user-sagi", text: "Cool. See you in My Group." },
];

const myGroupLines = [
  { senderId: "user-pavan", text: "Welcome to My Group." },
  { senderId: "user-sagi", text: "Thanks for adding us." },
  { senderId: "user-kumar", text: "Let's use this for updates." },
  { senderId: "user-rahul", text: "Sounds good." },
  { senderId: "user-akhil", text: "I am in. What are we covering today?" },
  { senderId: "user-pavan", text: "Quick check of chat, ticks, and group typing." },
  { senderId: "user-sagi", text: "I can test from my account." },
  { senderId: "user-kumar", text: "Same here." },
  { senderId: "user-rahul", text: "Should we keep Vishnu out of this one?" },
  { senderId: "user-pavan", text: "Yes. He is the new-chat demo." },
  { senderId: "user-akhil", text: "Makes sense." },
  { senderId: "user-sagi", text: "I dropped a note in the 1-1 as well." },
  { senderId: "user-pavan", text: "Saw it." },
  { senderId: "user-kumar", text: "The long Pavan chat is for scrolling." },
  { senderId: "user-rahul", text: "I will not spam that thread then." },
  { senderId: "user-akhil", text: "I will drop standup notes here." },
  { senderId: "user-pavan", text: "Perfect." },
  { senderId: "user-sagi", text: "Anyone on later tonight?" },
  { senderId: "user-kumar", text: "I can join after 8." },
  { senderId: "user-pavan", text: "See you all in the evening." },
  { senderId: "user-rahul", text: "Later." },
];

const messages: MessageRecord[] = [
  ...seedThread("chat-pavan-kumar", "msg-dm-", pavanKumarLines, 9),
  ...seedThread("chat-pavan-sagi", "msg-sagi-", pavanSagiLines, 14),
  seedSystemMessage(
    "msg-group-created",
    "chat-my-group",
    "Pavan created this group",
    hoursAgo(8),
  ),
  seedSystemMessage(
    "msg-group-added",
    "chat-my-group",
    "Pavan added Sagi, Kumar, Rahul and Akhil",
    minutesAgo(8 * 60 - 1),
  ),
  ...seedThread("chat-my-group", "msg-group-", myGroupLines, 16),
];

const seedReadAt = new Date().toISOString();
const lastReadAt: Record<string, Record<string, string>> = {
  "user-pavan": {
    "chat-pavan-kumar": seedReadAt,
    "chat-pavan-sagi": seedReadAt,
    "chat-my-group": seedReadAt,
  },
  "user-kumar": {
    "chat-pavan-kumar": seedReadAt,
    "chat-my-group": seedReadAt,
  },
  "user-sagi": {
    "chat-pavan-sagi": seedReadAt,
    "chat-my-group": seedReadAt,
  },
  "user-rahul": {
    "chat-my-group": seedReadAt,
  },
  "user-akhil": {
    "chat-my-group": seedReadAt,
  },
};

const onlineUserIds = new Set<string>();

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor,
    avatarUrl: user.avatarUrl || "",
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
    avatarUrl: "",
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

export function updateUserProfile(
  userId: string,
  name: string,
  email: string,
  currentPassword: string,
  newPassword: string,
  avatarUrl: string,
): UserRecord {
  const user = findUserById(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  const nextName = name.trim();
  const nextEmail = email.trim().toLowerCase();
  if (nextName.length < 2) {
    throw new Error("Name must be at least 2 characters.");
  }
  if (!nextEmail) {
    throw new Error("Enter an email address.");
  }

  const existing = findUserByEmail(nextEmail);
  if (existing && existing.id !== userId) {
    throw new Error("That email is already in use.");
  }

  user.name = nextName;
  user.email = nextEmail;
  user.avatarUrl = avatarUrl;

  if (currentPassword || newPassword) {
    if (!currentPassword) {
      throw new Error("Enter your current password to set a new one.");
    }
    if (!newPassword) {
      throw new Error("Enter a new password.");
    }
    if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
      throw new Error("Current password is incorrect.");
    }
    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    user.passwordHash = bcrypt.hashSync(newPassword, 8);
  }
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

  const actor = findUserById(adminId);
  const actorName = actor ? actor.name : "Someone";
  createSystemMessage(chat.id, actorName + " created this group");

  const addedNames: string[] = [];
  for (let i = 0; i < uniqueMembers.length; i += 1) {
    if (uniqueMembers[i] === adminId) {
      continue;
    }
    const person = findUserById(uniqueMembers[i]);
    if (person) {
      addedNames.push(person.name);
    }
  }
  if (addedNames.length > 0) {
    createSystemMessage(chat.id, actorName + " added " + formatNameList(addedNames));
  }

  return chat;
}

export function createSystemMessage(chatId: string, text: string): MessageRecord {
  const message: MessageRecord = {
    id: crypto.randomUUID(),
    chatId,
    senderId: "system",
    text,
    createdAt: new Date().toISOString(),
    kind: "system",
    attachments: [],
    reactions: [],
    status: "sent",
    deliveredTo: [],
    readBy: [],
  };
  messages.push(message);
  return message;
}

function requireGroupMember(chatId: string, actorId: string): ChatRecord {
  const chat = findChatById(chatId);
  if (!chat || chat.type !== "group") {
    throw new Error("Group not found.");
  }
  if (!chat.memberIds.includes(actorId)) {
    throw new Error("You are not in this group.");
  }
  return chat;
}

export function renameGroup(
  chatId: string,
  actorId: string,
  name: string,
): { chat: ChatRecord; message: MessageRecord } {
  const chat = requireGroupMember(chatId, actorId);
  const nextName = name.trim();
  if (nextName.length < 2) {
    throw new Error("Group name must be at least 2 characters.");
  }
  if (nextName === chat.name) {
    throw new Error("That is already the group name.");
  }

  const actor = findUserById(actorId);
  chat.name = nextName;
  const actorName = actor ? actor.name : "Someone";
  const message = createSystemMessage(
    chatId,
    actorName + ' changed the group name to "' + nextName + '"',
  );
  return { chat, message };
}

export function addGroupMember(
  chatId: string,
  actorId: string,
  userId: string,
): { chat: ChatRecord; message: MessageRecord } {
  const chat = requireGroupMember(chatId, actorId);
  const person = findUserById(userId);
  if (!person) {
    throw new Error("User not found.");
  }
  if (chat.memberIds.includes(userId)) {
    throw new Error("That person is already in the group.");
  }

  chat.memberIds.push(userId);
  if (!lastReadAt[userId]) {
    lastReadAt[userId] = {};
  }
  lastReadAt[userId][chatId] = new Date().toISOString();

  const actor = findUserById(actorId);
  const actorName = actor ? actor.name : "Someone";
  const message = createSystemMessage(chatId, actorName + " added " + person.name);
  return { chat, message };
}

export function removeGroupMember(
  chatId: string,
  actorId: string,
  userId: string,
): { chat: ChatRecord; message: MessageRecord; removedUserId: string } {
  const chat = requireGroupMember(chatId, actorId);
  const person = findUserById(userId);
  if (!person || !chat.memberIds.includes(userId)) {
    throw new Error("That person is not in this group.");
  }
  if (chat.memberIds.length <= 1) {
    throw new Error("A group needs at least one member.");
  }

  const nextMembers: string[] = [];
  for (let i = 0; i < chat.memberIds.length; i += 1) {
    if (chat.memberIds[i] !== userId) {
      nextMembers.push(chat.memberIds[i]);
    }
  }
  chat.memberIds = nextMembers;

  const nextAdmins: string[] = [];
  for (let i = 0; i < chat.adminIds.length; i += 1) {
    if (chat.adminIds[i] !== userId) {
      nextAdmins.push(chat.adminIds[i]);
    }
  }
  if (nextAdmins.length === 0 && nextMembers.length > 0) {
    nextAdmins.push(nextMembers[0]);
  }
  chat.adminIds = nextAdmins;

  const actor = findUserById(actorId);
  const actorName = actor ? actor.name : "Someone";
  const actionText =
    userId === actorId ? actorName + " left" : actorName + " removed " + person.name;
  const message = createSystemMessage(chatId, actionText);
  return { chat, message, removedUserId: userId };
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
      message.kind !== "system" &&
      message.senderId !== "system" &&
      !message.deletedAt &&
      message.createdAt > readAt
    );
  }).length;
}

export function markChatRead(userId: string, chatId: string, _messageIds: string[]): MessageRecord[] {
  if (!lastReadAt[userId]) {
    lastReadAt[userId] = {};
  }
  lastReadAt[userId][chatId] = new Date().toISOString();

  const updated: MessageRecord[] = [];
  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];
    if (
      message.chatId !== chatId ||
      message.senderId === userId ||
      message.deletedAt ||
      message.kind === "system" ||
      message.senderId === "system"
    ) {
      continue;
    }

    let changed = false;
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      changed = true;
    }
    if (!message.deliveredTo.includes(userId)) {
      message.deliveredTo.push(userId);
      changed = true;
    }

    const before = message.status;
    refreshMessageStatus(message);
    if (changed || before !== message.status) {
      updated.push(message);
    }
  }
  return updated;
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
  if (message.kind === "system" || message.senderId === "system") {
    return;
  }
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

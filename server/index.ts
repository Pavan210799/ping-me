import cors from "cors";
import express from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcryptjs";
import type { MessageRecord, SocketEvent } from "./types.ts";
import {
  addGroupMember,
  addMessage,
  createDirectChat,
  createGroupChat,
  createUser,
  findChatById,
  findMessageById,
  findUserByEmail,
  findUserById,
  getLastMessage,
  getUnreadCount,
  isUserOnline,
  listChatsForUser,
  listMessages,
  listPublicUsers,
  markChatRead,
  markDelivered,
  refreshMessageStatus,
  removeGroupMember,
  removeMessage,
  renameGroup,
  searchAllMessages,
  searchMessages,
  setUserOnline,
  toPublicUser,
  updatePassword,
  updateUserProfile,
} from "./store.ts";

const JWT_SECRET = process.env.JWT_SECRET || "pingme-dev-secret";
const PORT = Number(process.env.PORT) || 4000;
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const uploadsDir = process.env.AWS_LAMBDA_FUNCTION_NAME
  ? path.join("/tmp", "pingme-uploads")
  : path.join(currentDir, "uploads");
const distDir = path.join(currentDir, "..", "dist");

type SocketClient = {
  socket: WebSocket;
  userId: string | null;
};

const app = express();
const server = createServer(app);
const socketServer = new WebSocketServer({ server, path: "/ws" });
const clients: SocketClient[] = [];
const offlineTimers = new Map<string, ReturnType<typeof setTimeout>>();

fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname || "").toLowerCase();
      cb(null, crypto.randomUUID() + ext);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});
app.use(
  "/uploads",
  express.static(uploadsDir, {
    setHeaders(res, filePath) {
      if (path.extname(filePath)) {
        return;
      }
      try {
        const fd = fs.openSync(filePath, "r");
        const buf = Buffer.alloc(12);
        fs.readSync(fd, buf, 0, 12, 0);
        fs.closeSync(fd);
        if (buf[0] === 0x89 && buf[1] === 0x50) {
          res.type("png");
        } else if (buf[0] === 0xff && buf[1] === 0xd8) {
          res.type("jpeg");
        } else if (buf[0] === 0x47 && buf[1] === 0x49) {
          res.type("gif");
        } else if (buf[8] === 0x57 && buf[9] === 0x45) {
          res.type("webp");
        }
      } catch {
        return;
      }
    },
  }),
);
app.use(express.static(distDir));

function createToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

function readUserIdFromToken(token: string): string | null {
  try {
    const data = jwt.verify(token, JWT_SECRET) as { userId: string };
    return data.userId;
  } catch {
    return null;
  }
}

function getTokenFromHeader(req: express.Request): string {
  const header = req.headers.authorization ?? "";
  return header.replace("Bearer ", "");
}

function requireUser(req: express.Request, res: express.Response) {
  const userId = readUserIdFromToken(getTokenFromHeader(req));
  if (!userId) {
    res.status(401).json({ message: "Please log in again." });
    return null;
  }
  const user = findUserById(userId);
  if (!user) {
    res.status(401).json({ message: "Account not found." });
    return null;
  }
  return user;
}

function chatSummary(chatId: string, userId: string) {
  const chat = findChatById(chatId);
  if (!chat) {
    return null;
  }
  return {
    ...chat,
    lastMessage: getLastMessage(chat.id),
    unreadCount: getUnreadCount(userId, chat.id),
  };
}

function sendToSocket(socket: WebSocket, data: unknown): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

function sendToUser(userId: string, data: unknown): void {
  for (const client of clients) {
    if (client.userId === userId) {
      sendToSocket(client.socket, data);
    }
  }
}

function sendToChat(chatId: string, data: unknown, skipUserId?: string): void {
  const chat = findChatById(chatId);
  if (!chat) {
    return;
  }
  for (const memberId of chat.memberIds) {
    if (memberId === skipUserId) {
      continue;
    }
    sendToUser(memberId, data);
  }
}

function sendToEveryone(data: unknown): void {
  for (const client of clients) {
    sendToSocket(client.socket, data);
  }
}

function sendJsonError(res: express.Response, status: number, message: string): void {
  res.status(status).json({ message });
}

app.post("/api/auth/signup", (req, res) => {
  const name = String(req.body.name ?? "").trim();
  const email = String(req.body.email ?? "").trim();
  const password = String(req.body.password ?? "");

  if (name.length < 2 || !email.includes("@") || password.length < 6) {
    sendJsonError(res, 400, "Name, a valid email, and a 6+ character password are required.");
    return;
  }
  if (findUserByEmail(email)) {
    sendJsonError(res, 400, "That email is already in use.");
    return;
  }

  const user = createUser(name, email, password);
  res.json({ token: createToken(user.id), user: toPublicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const email = String(req.body.email ?? "").trim();
  const password = String(req.body.password ?? "");
  const user = findUserByEmail(email);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    sendJsonError(res, 400, "Email or password is incorrect.");
    return;
  }

  res.json({ token: createToken(user.id), user: toPublicUser(user) });
});

app.post("/api/auth/forgot", (req, res) => {
  const email = String(req.body.email ?? "").trim();
  const user = findUserByEmail(email);
  if (!user) {
    sendJsonError(res, 400, "No account found for that email.");
    return;
  }
  res.json({ email: user.email });
});

app.post("/api/auth/reset", (req, res) => {
  const email = String(req.body.email ?? "").trim();
  const password = String(req.body.password ?? "");
  try {
    const user = updatePassword(email, password);
    res.json({ email: user.email });
  } catch (error) {
    sendJsonError(res, 400, error instanceof Error ? error.message : "Could not reset password.");
  }
});

app.get("/api/auth/me", (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }
  res.json(toPublicUser(user));
});

app.post("/api/auth/profile", (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }
  try {
    const updated = updateUserProfile(
      user.id,
      String(req.body.name ?? ""),
      String(req.body.email ?? ""),
      String(req.body.currentPassword ?? ""),
      String(req.body.newPassword ?? ""),
      String(req.body.avatarUrl ?? user.avatarUrl ?? ""),
    );
    const publicUser = toPublicUser(updated);
    sendToEveryone({ type: "user:updated", user: publicUser });
    res.json(publicUser);
  } catch (err) {
    sendJsonError(res, 400, err instanceof Error ? err.message : "Could not update profile.");
  }
});

app.get("/api/users", (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }
  const people = listPublicUsers().filter((person) => person.id !== user.id);
  res.json(people);
});

app.get("/api/chats", (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }
  const result = listChatsForUser(user.id)
    .map((chat) => chatSummary(chat.id, user.id))
    .filter((chat) => chat !== null)
    .sort((a, b) => {
      const timeA = a.lastMessage?.createdAt ?? a.createdAt;
      const timeB = b.lastMessage?.createdAt ?? b.createdAt;
      return timeB.localeCompare(timeA);
    });
  res.json(result);
});

app.post("/api/chats/direct", (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }
  const otherUserId = String(req.body.userId ?? "");
  const otherUser = findUserById(otherUserId);
  if (!otherUser) {
    sendJsonError(res, 404, "User not found.");
    return;
  }
  const chat = createDirectChat(user.id, otherUser.id);
  res.json(chatSummary(chat.id, user.id));
});

app.post("/api/chats/group", (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }
  const name = String(req.body.name ?? "").trim();
  const memberIds = Array.isArray(req.body.memberIds) ? req.body.memberIds : [];
  if (name.length < 2 || memberIds.length < 1) {
    sendJsonError(res, 400, "A group needs a name and at least one other person.");
    return;
  }
  const chat = createGroupChat(name, memberIds, user.id);
  const created = listMessages(chat.id, 20);
  for (let i = 0; i < created.messages.length; i += 1) {
    sendToChat(chat.id, { type: "message:new", message: created.messages[i] });
  }
  broadcastChatUpdated(chat.id);
  res.json(chatSummary(chat.id, user.id));
});

function broadcastChatUpdated(chatId: string): void {
  const chat = findChatById(chatId);
  if (!chat) {
    return;
  }
  for (const memberId of chat.memberIds) {
    sendToUser(memberId, {
      type: "chat:updated",
      chat: chatSummary(chat.id, memberId),
    });
  }
}

function broadcastSystemMessage(message: MessageRecord): void {
  sendToChat(message.chatId, { type: "message:new", message });
  const chat = findChatById(message.chatId);
  if (!chat) {
    return;
  }
  for (const memberId of chat.memberIds) {
    sendToUser(memberId, {
      type: "unread",
      chatId: chat.id,
      count: getUnreadCount(memberId, chat.id),
    });
  }
  broadcastChatUpdated(message.chatId);
}

app.patch("/api/chats/:chatId", (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }
  try {
    const result = renameGroup(req.params.chatId, user.id, String(req.body.name ?? ""));
    broadcastSystemMessage(result.message);
    res.json({
      chat: chatSummary(result.chat.id, user.id),
      message: result.message,
    });
  } catch (error) {
    sendJsonError(res, 400, error instanceof Error ? error.message : "Could not rename group.");
  }
});

app.post("/api/chats/:chatId/members", (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }
  try {
    const result = addGroupMember(req.params.chatId, user.id, String(req.body.userId ?? ""));
    broadcastSystemMessage(result.message);
    res.json({
      chat: chatSummary(result.chat.id, user.id),
      message: result.message,
    });
  } catch (error) {
    sendJsonError(res, 400, error instanceof Error ? error.message : "Could not add member.");
  }
});

app.delete("/api/chats/:chatId/members/:userId", (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }
  try {
    const result = removeGroupMember(req.params.chatId, user.id, req.params.userId);
    sendToUser(result.removedUserId, { type: "chat:removed", chatId: result.chat.id });
    broadcastSystemMessage(result.message);
    res.json({
      chat: chatSummary(result.chat.id, user.id),
      message: result.message,
    });
  } catch (error) {
    sendJsonError(res, 400, error instanceof Error ? error.message : "Could not remove member.");
  }
});

app.get("/api/chats/:chatId/messages", (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }
  const chat = findChatById(req.params.chatId);
  if (!chat || !chat.memberIds.includes(user.id)) {
    sendJsonError(res, 404, "Chat not found.");
    return;
  }
  const limit = Number(req.query.limit ?? 30);
  const before = typeof req.query.before === "string" ? req.query.before : undefined;
  const result = listMessages(chat.id, limit, before);
  if (before) {
    setTimeout(function () {
      res.json(result);
    }, 700);
    return;
  }
  res.json(result);
});

app.get("/api/chats/:chatId/messages/search", (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }
  const chat = findChatById(req.params.chatId);
  if (!chat || !chat.memberIds.includes(user.id)) {
    sendJsonError(res, 404, "Chat not found.");
    return;
  }
  const query = String(req.query.q ?? "");
  res.json(searchMessages(chat.id, query));
});

app.get("/api/messages/search", (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }
  const query = String(req.query.q ?? "");
  res.json(searchAllMessages(user.id, query));
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  const user = requireUser(req, res);
  if (!user) {
    return;
  }
  if (!req.file) {
    sendJsonError(res, 400, "Choose a file to upload.");
    return;
  }

  const isImage = (req.file.mimetype || "").startsWith("image/");
  res.json({
    id: crypto.randomUUID(),
    name: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
    kind: isImage ? "image" : "document",
    size: req.file.size,
  });
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/ws")) {
    next();
    return;
  }
  res.sendFile(path.join(distDir, "index.html"), (error) => {
    if (error) {
      next();
    }
  });
});

function handleIncomingEvent(client: SocketClient, raw: string): void {
  let event: SocketEvent;
  try {
    event = JSON.parse(raw) as SocketEvent;
  } catch {
    sendToSocket(client.socket, { type: "error", message: "Invalid message." });
    return;
  }

  if (event.type === "ping") {
    sendToSocket(client.socket, { type: "pong" });
    return;
  }

  if (event.type === "auth") {
    const userId = readUserIdFromToken(event.token || "");
    const user = userId ? findUserById(userId) : undefined;
    if (!user) {
      sendToSocket(client.socket, { type: "auth:error", message: "Invalid token." });
      return;
    }

    client.userId = user.id;
    const pendingOffline = offlineTimers.get(user.id);
    if (pendingOffline) {
      clearTimeout(pendingOffline);
      offlineTimers.delete(user.id);
    }
    setUserOnline(user.id, true);
    sendToSocket(client.socket, { type: "auth:ok", user: toPublicUser(user) });

    for (const other of listPublicUsers()) {
      if (other.id !== user.id) {
        sendToUser(other.id, {
          type: "presence",
          userId: user.id,
          online: true,
          lastSeen: user.lastSeen,
        });
      }
    }

    for (const chat of listChatsForUser(user.id)) {
      const updated = markDelivered(user.id, chat.id);
      for (const message of updated) {
        sendToChat(chat.id, { type: "message:updated", message });
      }
    }
    return;
  }

  if (!client.userId) {
    sendToSocket(client.socket, { type: "error", message: "Please authenticate first." });
    return;
  }

  const userId = client.userId;

  if (event.type === "message:send") {
    const chat = findChatById(event.chatId || "");
    if (!chat || !chat.memberIds.includes(userId)) {
      sendToSocket(client.socket, { type: "error", message: "You cannot send to this chat." });
      return;
    }

    const message: MessageRecord = {
      id: crypto.randomUUID(),
      chatId: chat.id,
      senderId: userId,
      text: String(event.text ?? "").trim(),
      createdAt: new Date().toISOString(),
      replyToId: event.replyToId,
      clientId: event.clientId,
      attachments: event.attachments ?? [],
      reactions: [],
      status: "sent",
      deliveredTo: [],
      readBy: [],
    };
    addMessage(message);

    for (const memberId of chat.memberIds) {
      if (memberId !== userId && isUserOnline(memberId)) {
        message.deliveredTo.push(memberId);
      }
    }
    refreshMessageStatus(message);
    sendToChat(chat.id, { type: "message:new", message });

    for (const memberId of chat.memberIds) {
      if (memberId === userId) {
        continue;
      }
      sendToUser(memberId, {
        type: "unread",
        chatId: chat.id,
        count: getUnreadCount(memberId, chat.id),
      });
    }
    return;
  }

  if (event.type === "message:edit") {
    const message = findMessageById(event.messageId || "");
    if (!message || message.senderId !== userId) {
      sendToSocket(client.socket, { type: "error", message: "You can only edit your messages." });
      return;
    }
    message.text = String(event.text || "").trim();
    message.updatedAt = new Date().toISOString();
    sendToChat(message.chatId, { type: "message:updated", message });
    return;
  }

  if (event.type === "message:delete") {
    const message = findMessageById(event.messageId || "");
    if (!message || message.senderId !== userId) {
      sendToSocket(client.socket, { type: "error", message: "You can only delete your messages." });
      return;
    }
    const chatId = message.chatId;
    removeMessage(message.id);
    sendToChat(chatId, { type: "message:deleted", chatId, messageId: message.id });
    return;
  }

  if (event.type === "message:react") {
    const message = findMessageById(event.messageId || "");
    const emoji: string = event.emoji || "";
    if (!message || !emoji) {
      return;
    }
    const current = message.reactions.find((reaction) => reaction.userId === userId);
    message.reactions = message.reactions.filter((reaction) => reaction.userId !== userId);
    if (!current || current.emoji !== emoji) {
      message.reactions.push({ emoji: emoji, userId: userId });
    }
    sendToChat(message.chatId, { type: "message:updated", message });
    return;
  }

  if (event.type === "message:read") {
    const chat = findChatById(event.chatId || "");
    if (!chat || !chat.memberIds.includes(userId)) {
      return;
    }
    const updated = markChatRead(userId, chat.id, event.messageIds || []);
    for (let i = 0; i < updated.length; i += 1) {
      sendToChat(chat.id, { type: "message:updated", message: updated[i] });
    }
    sendToUser(userId, { type: "unread", chatId: chat.id, count: 0 });
    return;
  }

  if (event.type === "typing:start" || event.type === "typing:stop") {
    sendToChat(
      event.chatId || "",
      {
        type: "typing",
        chatId: event.chatId,
        userId,
        isTyping: event.type === "typing:start",
      },
      userId,
    );
  }
}

socketServer.on("connection", (socket) => {
  const client: SocketClient = { socket, userId: null };
  clients.push(client);

  socket.on("message", (raw) => {
    handleIncomingEvent(client, String(raw));
  });

  socket.on("close", () => {
    const index = clients.indexOf(client);
    if (index >= 0) {
      clients.splice(index, 1);
    }

    if (!client.userId) {
      return;
    }

    const stillConnected = clients.some((item) => item.userId === client.userId);
    if (stillConnected) {
      return;
    }

    const goneUserId = client.userId;
    const existingTimer = offlineTimers.get(goneUserId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    offlineTimers.set(
      goneUserId,
      setTimeout(() => {
        offlineTimers.delete(goneUserId);
        if (clients.some((item) => item.userId === goneUserId)) {
          return;
        }

        setUserOnline(goneUserId, false);
        const user = findUserById(goneUserId);
        if (!user) {
          return;
        }
        for (const other of listPublicUsers()) {
          sendToUser(other.id, {
            type: "presence",
            userId: user.id,
            online: false,
            lastSeen: user.lastSeen,
          });
        }
      }, 2500),
    );
  });
});

if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`PingMe API and WebSocket running on http://0.0.0.0:${PORT}`);
  });
}

export { app, server };

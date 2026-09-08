import type { Attachment, Chat, Message, User } from "./types";

const TOKEN_KEY = "pingme-token-v2";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message ?? "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json() as Promise<T>;
}

export function loginRequest(email: string, password: string) {
  return request<{ token: string; user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signupRequest(name: string, email: string, password: string) {
  return request<{ token: string; user: User }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function forgotPasswordRequest(email: string) {
  return request<{ email: string }>("/api/auth/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPasswordRequest(email: string, password: string) {
  return request<{ email: string }>("/api/auth/reset", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function meRequest() {
  return request<User>("/api/auth/me");
}

export function usersRequest() {
  return request<User[]>("/api/users");
}

export function chatsRequest() {
  return request<Chat[]>("/api/chats");
}

export function createDirectChatRequest(userId: string) {
  return request<Chat>("/api/chats/direct", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export function createGroupChatRequest(name: string, memberIds: string[]) {
  return request<Chat>("/api/chats/group", {
    method: "POST",
    body: JSON.stringify({ name, memberIds }),
  });
}

const MESSAGE_PAGE_SIZE = 8;

export function messagesRequest(chatId: string, before?: string) {
  const query = before
    ? `?limit=${MESSAGE_PAGE_SIZE}&before=${before}`
    : `?limit=${MESSAGE_PAGE_SIZE}`;
  return request<{ messages: Message[]; hasMore: boolean }>(
    `/api/chats/${chatId}/messages${query}`,
  );
}

export function searchMessagesRequest(chatId: string, query: string) {
  return request<Message[]>(
    `/api/chats/${chatId}/messages/search?q=${encodeURIComponent(query)}`,
  );
}

export function uploadFile(
  file: File,
  token: string,
  onProgress: (percent: number) => void,
): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as Attachment);
        return;
      }
      reject(new Error("Upload failed. Try again."));
    };

    xhr.onerror = () => {
      reject(new Error("Upload failed. Try again."));
    };

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

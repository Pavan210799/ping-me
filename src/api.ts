import { apiUrl } from "./lib/backend";
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

function authHeaders() {
  const token = getStoredToken();
  const headers: { [key: string]: string } = {};
  if (token) {
    headers.Authorization = "Bearer " + token;
  }
  return headers;
}

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message || fallback;
  } catch {
    return fallback;
  }
}

export async function loginRequest(email: string, password: string) {
  const response = await fetch(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to log in."));
  }

  return response.json() as Promise<{ token: string; user: User }>;
}

export async function signupRequest(name: string, email: string, password: string) {
  const response = await fetch(apiUrl("/api/auth/signup"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to create account."));
  }

  return response.json() as Promise<{ token: string; user: User }>;
}

export async function forgotPasswordRequest(email: string) {
  const response = await fetch(apiUrl("/api/auth/forgot"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to find that account."));
  }

  return response.json() as Promise<{ email: string }>;
}

export async function resetPasswordRequest(email: string, password: string) {
  const response = await fetch(apiUrl("/api/auth/reset"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to reset password."));
  }

  return response.json() as Promise<{ email: string }>;
}

export async function meRequest() {
  const response = await fetch(apiUrl("/api/auth/me"), {
    headers: {
      ...authHeaders(),
    },
  });

  if (response.status === 401) {
    throw new Error("unauthorized");
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load profile."));
  }

  return response.json() as Promise<User>;
}

export async function updateProfileRequest(data: {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  avatarUrl: string;
}) {
  const response = await fetch(apiUrl("/api/auth/profile"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to update profile."));
  }

  return response.json() as Promise<User>;
}

export async function usersRequest() {
  const response = await fetch(apiUrl("/api/users"), {
    headers: {
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load people."));
  }

  return response.json() as Promise<User[]>;
}

export async function chatsRequest() {
  const response = await fetch(apiUrl("/api/chats"), {
    headers: {
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load chats."));
  }

  return response.json() as Promise<Chat[]>;
}

export async function createDirectChatRequest(userId: string) {
  const response = await fetch(apiUrl("/api/chats/direct"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to start chat."));
  }

  return response.json() as Promise<Chat>;
}

export async function createGroupChatRequest(name: string, memberIds: string[]) {
  const response = await fetch(apiUrl("/api/chats/group"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ name, memberIds }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to create group."));
  }

  return response.json() as Promise<Chat>;
}

export async function renameGroupRequest(chatId: string, name: string) {
  const response = await fetch(apiUrl(`/api/chats/${chatId}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to rename group."));
  }

  return response.json() as Promise<{ chat: Chat; message: Message }>;
}

export async function addGroupMemberRequest(chatId: string, userId: string) {
  const response = await fetch(apiUrl(`/api/chats/${chatId}/members`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to add member."));
  }

  return response.json() as Promise<{ chat: Chat; message: Message }>;
}

export async function removeGroupMemberRequest(chatId: string, userId: string) {
  const response = await fetch(apiUrl(`/api/chats/${chatId}/members/${userId}`), {
    method: "DELETE",
    headers: {
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to remove member."));
  }

  return response.json() as Promise<{ chat: Chat; message: Message }>;
}

const MESSAGE_PAGE_SIZE = 15;

export async function messagesRequest(chatId: string, before?: string) {
  let url = apiUrl(`/api/chats/${chatId}/messages?limit=${MESSAGE_PAGE_SIZE}`);
  if (before) {
    url = `${url}&before=${before}`;
  }

  const response = await fetch(url, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load messages."));
  }

  return response.json() as Promise<{ messages: Message[]; hasMore: boolean }>;
}

export async function searchMessagesRequest(chatId: string, query: string) {
  const url = apiUrl(`/api/chats/${chatId}/messages/search?q=${encodeURIComponent(query)}`);
  const response = await fetch(url, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to search messages."));
  }

  return response.json() as Promise<Message[]>;
}

export async function searchAllMessagesRequest(query: string) {
  const url = apiUrl(`/api/messages/search?q=${encodeURIComponent(query)}`);
  const response = await fetch(url, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to search messages."));
  }

  return response.json() as Promise<Message[]>;
}

export function uploadFile(
  file: File,
  token: string,
  onProgress: (percent: number) => void,
): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", apiUrl("/api/upload"));
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
      reject(new Error("Failed to upload file."));
    };

    xhr.onerror = () => {
      reject(new Error("Failed to upload file."));
    };

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

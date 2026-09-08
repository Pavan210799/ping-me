export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDay(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatLastSeen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 45_000) {
    return "just now";
  }

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86_400_000);

  if (dayDiff === 0) {
    return `today at ${time}`;
  }
  if (dayDiff === 1) {
    return `yesterday at ${time}`;
  }
  if (dayDiff > 1 && dayDiff < 7) {
    const weekday = date.toLocaleDateString([], { weekday: "long" });
    return `${weekday} at ${time}`;
  }

  const day = date.toLocaleDateString([], { day: "numeric", month: "short" });
  return `${day} at ${time}`;
}

export function fileSizeLabel(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function chatTitle(
  chatName: string,
  memberIds: string[],
  currentUserId: string,
  usersById: Record<string, { name: string }>,
): string {
  if (chatName) {
    return chatName;
  }
  const otherId = memberIds.find((id) => id !== currentUserId);
  return otherId ? usersById[otherId]?.name ?? "Chat" : "Chat";
}

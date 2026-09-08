import type { ClientEvent, ConnectionStatus, ServerEvent } from "./types";

function getSocketUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/ws`;
}

type SocketHandlers = {
  token: string;
  onEvent: (event: ServerEvent) => void;
  onStatus: (status: ConnectionStatus) => void;
};

export type ChatSocket = {
  send: (event: ClientEvent) => boolean;
  close: () => void;
};

export function connectChatSocket(handlers: SocketHandlers): ChatSocket {
  let socket: WebSocket | null = null;
  let closedByUser = false;
  let retryDelay = 1000;
  let pingTimer = 0;

  function clearPing(): void {
    if (pingTimer) {
      window.clearInterval(pingTimer);
      pingTimer = 0;
    }
  }

  function connect(): void {
    handlers.onStatus("connecting");
    socket = new WebSocket(getSocketUrl());

    socket.onopen = () => {
      retryDelay = 1000;
      handlers.onStatus("connected");
      socket?.send(JSON.stringify({ type: "auth", token: handlers.token }));
      clearPing();
      pingTimer = window.setInterval(() => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    };

    socket.onmessage = (messageEvent) => {
      try {
        const event = JSON.parse(String(messageEvent.data)) as ServerEvent;
        handlers.onEvent(event);
      } catch {
        // Ignore messages that are not JSON.
      }
    };

    socket.onerror = () => {
      handlers.onStatus("offline");
    };

    socket.onclose = () => {
      clearPing();
      handlers.onStatus("offline");
      if (closedByUser) {
        return;
      }
      window.setTimeout(connect, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 10000);
    };
  }

  connect();

  return {
    send(event) {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(event));
        return true;
      }
      return false;
    },
    close() {
      closedByUser = true;
      clearPing();
      socket?.close();
    },
  };
}

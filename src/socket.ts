import { socketUrl } from "./lib/backend";
import type { SocketEvent } from "./types";

export function connectChatSocket(options: {
  token: string;
  onEvent: (event: SocketEvent) => void;
  onStatus: (status: string) => void;
}) {
  let socket: WebSocket | null = null;
  let closedByUser = false;
  let retryDelay = 1000;
  let pingTimer = 0;

  function stopPing() {
    if (pingTimer) {
      window.clearInterval(pingTimer);
      pingTimer = 0;
    }
  }

  function connect() {
    options.onStatus("connecting");
    socket = new WebSocket(socketUrl());

    socket.onopen = function () {
      retryDelay = 1000;
      options.onStatus("connected");

      if (socket) {
        socket.send(JSON.stringify({ type: "auth", token: options.token }));
      }

      stopPing();
      pingTimer = window.setInterval(function () {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    };

    socket.onmessage = function (messageEvent) {
      try {
        const event = JSON.parse(String(messageEvent.data)) as SocketEvent;
        options.onEvent(event);
      } catch {
        return;
      }
    };

    socket.onerror = function () {
      options.onStatus("offline");
    };

    socket.onclose = function () {
      stopPing();
      options.onStatus("offline");

      if (closedByUser) {
        return;
      }

      window.setTimeout(connect, retryDelay);
      if (retryDelay < 10000) {
        retryDelay = retryDelay * 2;
      }
    };
  }

  connect();

  return {
    send(event: SocketEvent) {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(event));
        return true;
      }
      return false;
    },
    close() {
      closedByUser = true;
      stopPing();
      if (socket) {
        socket.close();
      }
    },
  };
}

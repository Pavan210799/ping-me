# PingMe

Real-time chat app built with **React**, **TypeScript**, **Tailwind CSS**, a **REST API**, and **WebSockets**.

The UI uses a warm paper palette: cream surfaces, terracotta sent bubbles, green online dots, and blue read receipts.

## Run locally

```bash
cd ping-me
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173). If that port is already taken, Vite will print another local URL (for example `5174`).

The Vite app runs on port `5173`. The API and WebSocket server run on port `4000`. Vite proxies `/api`, `/uploads`, and `/ws` so the frontend can use simple beginner-friendly URLs.

## Demo accounts

Password for every seeded user: `123456`

Logged-in demo (pre-filled): **Pavan** — `pavan@gmail.com`

Sidebar chats for Pavan:

- Kumar — long history (8 messages per page, scroll up to load earlier)
- Sagi
- Group: my group

Other accounts you can open in a second window:

- `sagi@gmail.com`
- `kumar@gmail.com`
- `rahul@gmail.com`
- `akhil@gmail.com`
- `vishnu@gmail.com`

## What is included

- Login / signup and protected routes
- Password show/hide toggle
- One-to-one and group chats
- WebSocket messages with auto-reconnect
- Online / offline status
- Typing indicators
- Sent, delivered, and read ticks
- Edit, delete, reply, copy, and replaceable emoji reactions
- Optimistic send + retry on failure
- Unread counts and in-app notifications
- Debounced message search
- Image / document upload with progress
- Infinite scroll pagination (8 messages at a time)
- Loading, empty, and error states
- Responsive layout and light / dark mode

## Project layout

```text
src/           React + TypeScript UI
src/context/   Auth, theme, and chat state
src/socket.ts  Beginner-friendly WebSocket client
server/        Express REST API + WebSocket server
public/logo.svg
```
# ping-me

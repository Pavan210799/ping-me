import { useChat } from "../context/ChatContext";
import { ChatBackground } from "../components/chat/ChatBackground";
import { ChatThread } from "../components/chat/ChatThread";
import { ConnectionBanner } from "../components/chat/ConnectionBanner";
import { Sidebar } from "../components/chat/Sidebar";
import { ToastStack } from "../components/chat/ToastStack";
import { Logo } from "../components/Logo";

export function ChatPage() {
  const { activeChatId, selectChat } = useChat();

  return (
    <div className="app-shell flex h-screen flex-col text-ink">
      <ConnectionBanner />
      <div className="flex min-h-0 flex-1">
        <div
          className={`h-full w-full md:flex md:w-80 ${
            activeChatId ? "hidden md:flex" : "flex"
          }`}
        >
          <Sidebar />
        </div>
        {activeChatId ? (
          <ChatThread onBack={() => void selectChat(null)} />
        ) : (
          <div className="chat-wallpaper relative hidden flex-1 place-items-center md:grid">
            <ChatBackground />
            <div className="relative z-10 animate-fade-in text-center">
              <div className="animate-logo-float mx-auto w-fit">
                <Logo size={96} />
              </div>
              <h2 className="mt-4 text-2xl font-semibold">Welcome to PingMe</h2>
              <p className="mt-2 text-sm text-quiet">
                Pick a conversation or start a new one.
              </p>
            </div>
          </div>
        )}
      </div>
      <ToastStack />
    </div>
  );
}

import { WifiOff } from "lucide-react";
import { useChat } from "../../context/ChatContext";

export function ConnectionBanner() {
  const { connectionStatus } = useChat();

  if (connectionStatus === "connected") {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 bg-hover px-3 py-2 text-sm text-secondary">
      <WifiOff size={14} />
      {connectionStatus === "connecting"
        ? "Connecting to PingMe..."
        : "Offline. Trying to reconnect..."}
    </div>
  );
}

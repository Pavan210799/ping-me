import { Component, StrictMode } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

class RootErrorBoundary extends Component<{ children: ReactNode }, { message: string }> {
  state = { message: "" };

  static getDerivedStateFromError(error: Error) {
    return { message: error.message || "Something went wrong." };
  }

  render() {
    if (this.state.message) {
      return (
        <div className="grid min-h-screen place-items-center bg-page p-6 text-center text-ink">
          <div>
            <p className="text-lg font-semibold">PingMe hit a problem.</p>
            <p className="mt-2 text-sm text-quiet">{this.state.message}</p>
            <button
              type="button"
              className="mt-4 rounded-xl bg-accent px-4 py-2 text-white"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);

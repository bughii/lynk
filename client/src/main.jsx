import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Toaster } from "./components/ui/sonner";
import { SocketProvider } from "./context/SocketContext.jsx";
import "./utils/i18n.js";

createRoot(document.getElementById("root")).render(
  <SocketProvider>
    <App />
    <Toaster
      theme="dark"
      className="dark"
      toastOptions={{
        classNames: {
          toast:
            "bg-zinc-900 text-white border-zinc-800 cursor-grab active:cursor-grabbing touch-none select-none",
          description: "text-zinc-400 pointer-events-none",
          actionButton: "bg-zinc-700 pointer-events-auto",
          cancelButton: "bg-zinc-700 pointer-events-auto",
          title: "pointer-events-none",
          inner: "pointer-events-none",
        },
        icon: null,
      }}
      closeButton={false}
      dismissible={true}
      dragToClose={true}
    />
  </SocketProvider>
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Toaster } from "./components/ui/sonner";
import { SocketProvider } from "./context/SocketContext.jsx";

createRoot(document.getElementById("root")).render(
  <SocketProvider>
    <App />
    <Toaster
      toastOptions={{
        classNames: {
          closeButton: "bg-black",
        },
      }}
      closeButton
    />
  </SocketProvider>
);

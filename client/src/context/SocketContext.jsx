import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { HOST } from "@/utils/constants";
import { io } from "socket.io-client";
import { useChatStore } from "@/store/chatStore";

// Creating a socket to be abe to share data between components without props
const SocketContext = createContext(null);

// Custom hook that returns the socket
export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      const newSocket = io(HOST, {
        withCredentials: true,
        query: { userId: user._id },
      });
      newSocket.on("connect", () => {
        console.log("Connected to socket server");
      });

      newSocket.on("receiveMessage", (message) => {
        const { selectedChatData, selectedChatType, addMessage } =
          useChatStore.getState();

        if (
          selectedChatType !== undefined &&
          (selectedChatData._id === message.sender._id ||
            selectedChatData._id === message.recipient._id)
        ) {
          console.log("message received", message);
          addMessage(message);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

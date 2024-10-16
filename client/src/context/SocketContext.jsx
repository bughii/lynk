import { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { HOST } from "@/utils/constants";
import { io } from "socket.io-client";
import { useChatStore } from "@/store/chatStore";
import { useFriendStore } from "@/store/friendStore";

// Creating a context to be able to share the socket between components without props
const SocketContext = createContext(null);

// Custom hook that allows to easily access the socket inside any component that uses the SocketContext
export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState();
  const { user } = useAuthStore();
  const { updateFriendStatus } = useFriendStore();
  const {
    incrementUnreadCount,
    setUnreadMessagesCount,
    addGroup,
    updateGroupList,
  } = useChatStore();

  useEffect(() => {
    // If the user is authenticated, create a new socket connection
    if (user) {
      const newSocket = io(HOST, {
        withCredentials: true,
        query: { userId: user._id }, // sending the user id to the server
      });

      // Events handled by socket server

      // When the socket is connected, emit the event to the server to get the unread messages
      newSocket.on("connect", () => {
        console.log("Connected to socket server");
        newSocket.emit("getUnreadMessages");
      });

      // When the server sends a new message, update the chat store
      newSocket.on("receiveMessage", (message) => {
        const { selectedChatData, selectedChatType, addMessage } =
          useChatStore.getState();

        addMessage(message);

        /*
         * Determine if the incoming message belongs to the currently selected chat.
         *
         * Conditions:
         * 1. The user isn't viewing any chat
         * 2. The user is viewing a friend chat but the message is from a different friend
         * 3. The user is in a channel but the message is from a different channel
         *
         */

        if (
          !selectedChatData ||
          (selectedChatType === "friend" &&
            selectedChatData._id !== message.sender._id &&
            selectedChatData._id !== message.recipient._id) ||
          (selectedChatType === "channel" &&
            selectedChatData._id !== message.channel)
        ) {
          // If any of the conditions are met, the message is unread
          incrementUnreadCount(message.sender._id);
        }
      });

      // When the server sends the unread messages state, update the chat store
      newSocket.on("unreadMessagesState", (unreadMessages) => {
        console.log(
          "Received unread messages state from server:",
          unreadMessages
        );
        setUnreadMessagesCount(unreadMessages);
      });

      // When the server sends the user status update, update the friend status
      newSocket.on("userStatusUpdate", (status) => {
        const { userId, isOnline } = status;
        updateFriendStatus(userId, isOnline);
      });

      newSocket.on("groupCreated", (group) => {
        console.log("Received new group:", group);
        addGroup(group);
      });

      const handleReceiveGroupMessage = (message) => {
        const { selectedChatData, selectedChatType, addMessage } =
          useChatStore.getState();
        console.log("Current chat:", selectedChatType, selectedChatData);
        console.log("Incoming message:", message);
        if (
          selectedChatType === "group" &&
          selectedChatData._id === message.groupId
        ) {
          console.log("Adding message to store");
          addMessage(message);
        } else {
          console.log(
            "Message not added to store. Reason:",
            selectedChatType !== "group"
              ? "Not in a group chat"
              : "Group ID mismatch"
          );
        }
        updateGroupList(message);
      };

      newSocket.on("receiveGroupMessage", (message) => {
        console.log("Received group message:", message);
        handleReceiveGroupMessage(message);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [
    user,
    updateFriendStatus,
    incrementUnreadCount,
    setUnreadMessagesCount,
    addGroup,
  ]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

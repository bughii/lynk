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
  const [socket, setSocket] = useState(null);
  const { user } = useAuthStore();
  const { updateFriendStatus } = useFriendStore();
  const {
    incrementUnreadCount,
    incrementGroupUnreadCount,
    setUnreadMessagesCount,
    setUnreadGroupMessagesState,
    addGroup,
    addMessage,
    updateGroupList,
  } = useChatStore();
  const setChatStoreSocket = useChatStore((state) => state.setSocket);

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
        const { unreadMessagesCount, unreadGroupMessagesCount } =
          useChatStore.getState();

        // Always emit current unread counts to server
        newSocket.emit("syncUnreadCounts", {
          unreadMessagesCount: unreadMessagesCount || {},
          unreadGroupMessagesCount: unreadGroupMessagesCount || {},
        });

        console.log("Connected to socket server");
        setChatStoreSocket(newSocket);

        // Explicitly fetch unread counts from server
        newSocket.emit("fetchUnreadCounts", user._id);
      });

      newSocket.on("resetUnreadCount", (data) => {
        console.log("Server acknowledged resetUnreadCount:", data);
      });

      newSocket.on("resetGroupUnreadCount", (data) => {
        console.log("Server acknowledged resetGroupUnreadCount:", data);
      });

      // When the server sends a new message, update the chat store
      newSocket.on("receiveMessage", (message) => {
        const { selectedChatData, selectedChatType, addMessage } =
          useChatStore.getState();

        // Check if the message belongs to the currently selected private chat
        if (
          selectedChatType === "friend" &&
          selectedChatData &&
          (selectedChatData._id === message.sender._id ||
            selectedChatData._id === message.recipient._id)
        ) {
          addMessage(message); // Add the message only if it belongs to the selected chat
        } else {
          // Increment unread count if the message doesn't belong to the selected chat
          incrementUnreadCount(message.sender._id);
        }
      });

      newSocket.on("receiveGroupMessage", (message) => {
        const { selectedChatData, selectedChatType, addMessage } =
          useChatStore.getState();

        // Check if the message belongs to the currently selected group chat
        if (
          selectedChatType === "group" &&
          selectedChatData &&
          selectedChatData._id === message.groupId
        ) {
          addMessage(message); // Add the message only if it belongs to the selected group chat
        } else {
          // Increment unread group count if the message doesn't belong to the selected group chat
          incrementGroupUnreadCount(message.groupId);
        }

        // Update the group list to move the group to the top
        updateGroupList(message);
      });

      // When the server sends the unread messages state, update the chat store
      newSocket.on("unreadGroupMessagesState", (serverUnreadGroupMessages) => {
        const currentGroupLocalState =
          useChatStore.getState().unreadGroupMessagesCount || {};

        // More aggressive reset
        const mergedGroupState = Object.keys({
          ...currentGroupLocalState,
          ...serverUnreadGroupMessages,
        }).reduce((acc, groupId) => {
          // Only keep counts that exist in the server state
          if (serverUnreadGroupMessages[groupId] !== undefined) {
            acc[groupId] = serverUnreadGroupMessages[groupId];
          }
          return acc;
        }, {});

        setUnreadGroupMessagesState(serverUnreadGroupMessages || {});
      });

      newSocket.on("unreadMessagesState", (unreadMessages) => {
        const currentLocalState =
          useChatStore.getState().unreadMessagesCount || {};

        // More aggressive reset
        const mergedState = Object.keys({
          ...currentLocalState,
          ...unreadMessages,
        }).reduce((acc, senderId) => {
          // Only keep counts that exist in the server state
          if (unreadMessages[senderId] !== undefined) {
            acc[senderId] = unreadMessages[senderId];
          }
          return acc;
        }, {});

        setUnreadMessagesCount(mergedState);
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

      setSocket(newSocket);

      return () => {
        if (newSocket) {
          console.log("Cleaning up socket listeners");
          newSocket.off("connect");
          newSocket.off("resetUnreadCount");
          newSocket.off("resetGroupUnreadCount");
          newSocket.off("receiveMessage");
          newSocket.off("receiveGroupMessage");
          newSocket.off("unreadMessagesState");
          newSocket.off("unreadGroupMessagesState");
          newSocket.off("userStatusUpdate");
          newSocket.off("groupCreated");

          newSocket.disconnect();
          setChatStoreSocket(null);
        }
      };
    }
  }, [
    user,
    updateFriendStatus,
    incrementUnreadCount,
    incrementGroupUnreadCount,
    setUnreadMessagesCount,
    setUnreadGroupMessagesState,
    addGroup,
    addMessage,
    updateGroupList,
    setChatStoreSocket,
  ]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

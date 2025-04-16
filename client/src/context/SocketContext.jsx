import { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { HOST } from "@/utils/constants";
import { io } from "socket.io-client";
import { useChatStore } from "@/store/chatStore";
import { useFriendStore } from "@/store/friendStore";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

// Creating a context to be able to share the socket between components without props
const SocketContext = createContext(null);

// Custom hook that allows to easily access the socket inside any component that uses the SocketContext
export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const { t } = useTranslation();
  const [socket, setSocket] = useState(null);
  const { user } = useAuthStore();
  const { updateFriendStatus } = useFriendStore();
  const {
    incrementUnreadCount,
    incrementGroupUnreadCount,
    setUnreadMessagesCount,
    setUnreadGroupMessagesCount,
    addGroup,
    addMessage,
    updateGroupList,
  } = useChatStore();
  const setChatStoreSocket = useChatStore((state) => state.setSocket);
  const userId = user?._id;

  useEffect(() => {
    // If the user is authenticated, create a new socket connection
    if (userId) {
      const newSocket = io(HOST, {
        path: "/socket.io/",
        withCredentials: true,
        query: { userId: userId },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // When the socket is connected, emit the event to the server to get the unread messages
      newSocket.on("connect", () => {
        setSocket(newSocket); // Store the socket in state
        setChatStoreSocket(newSocket); // Store the socket in chat store
        const { unreadMessagesCount, unreadGroupMessagesCount } =
          useChatStore.getState();

        // Always emit current unread counts to server for merging
        newSocket.emit("syncUnreadCounts", {
          unreadMessagesCount: unreadMessagesCount || {},
          unreadGroupMessagesCount: unreadGroupMessagesCount || {},
        });
      });

      newSocket.on("profileImageUpdated", ({ userId, imageUrl }) => {
        const { updateUserProfileImage } = useChatStore.getState();

        // Update the user's image across the app
        if (updateUserProfileImage) {
          updateUserProfileImage(userId, imageUrl);
        }

        // Also update in friend store if needed
        const { updateFriendProfileImage } = useFriendStore.getState();
        if (updateFriendProfileImage) {
          updateFriendProfileImage(userId, imageUrl);
        }
      });

      // When the server sends a new message, update the chat store
      newSocket.on("receiveMessage", (message) => {
        const { selectedChatData, selectedChatType, addMessage } =
          useChatStore.getState();
        const { user } = useAuthStore.getState(); // Get current user to properly compare

        // Standardize the structure of the message
        const processedMessage = {
          ...message,
          // If the sender is provided as a string, convert it to an object with an _id property
          // If it is already an object, leave it as is
          sender:
            typeof message.sender === "string"
              ? { _id: message.sender }
              : message.sender,
          // Ensure the recipient is also an object with an _id property
          recipient:
            typeof message.recipient === "string"
              ? { _id: message.recipient }
              : message.recipient,
        };

        // Check if we should add the message to the current chat
        if (
          selectedChatType === "friend" &&
          selectedChatData &&
          (selectedChatData._id === processedMessage.sender._id ||
            selectedChatData._id === processedMessage.recipient._id)
        ) {
          // Flag to indicate if the message is from the current user
          // Will need it for the UI rendering
          processedMessage.isCurrentUserSender =
            processedMessage.sender._id === user._id;

          // At this point, the message is guaranteed to have the sender and recipient properties
          addMessage(processedMessage);
        } else {
          // Increment unread count if the message doesn't belong to the selected chat
          // Only increment counts for messages we receive, not those we send
          if (processedMessage.sender._id !== user._id) {
            incrementUnreadCount(processedMessage.sender._id);
          }
        }
      });

      newSocket.on("receiveGroupMessage", (message) => {
        const { selectedChatData, selectedChatType, addMessage } =
          useChatStore.getState();
        const { user } = useAuthStore.getState();

        // Check if the message belongs to the currently selected group chat
        if (
          selectedChatType === "group" &&
          selectedChatData &&
          selectedChatData._id === message.groupId
        ) {
          addMessage(message); // Add the message only if it belongs to the selected group chat
        } else {
          // Only increment unread count if we didn't send this message
          if (message.sender._id !== user._id) {
            incrementGroupUnreadCount(message.groupId);
          }
        }

        // Update the group list to move the group to the top
        updateGroupList(message);
      });

      // Handle full unread count states from server
      newSocket.on("fullUnreadMessagesState", (unreadMessages) => {
        setUnreadMessagesCount(unreadMessages || {});
      });

      newSocket.on("fullUnreadGroupMessagesState", (unreadGroupMessages) => {
        setUnreadGroupMessagesCount(unreadGroupMessages || {});
      });

      // For backward compatibility
      newSocket.on("unreadMessagesState", (unreadMessages) => {
        setUnreadMessagesCount(unreadMessages || {});
      });

      newSocket.on("unreadGroupMessagesState", (unreadGroupMessages) => {
        setUnreadGroupMessagesCount(unreadGroupMessages || {});
      });

      // When the server sends the user status update, update the friend status
      newSocket.on("userStatusUpdate", (status) => {
        const { userId, isOnline } = status;
        updateFriendStatus(userId, isOnline);
      });

      // Other event handlers remain the same
      newSocket.on("blockedByUser", (data) => {
        const { blockerId } = data;

        // Get state updating methods from the store
        const {
          addBlockedByUser,
          setSelectedChatData,
          selectedChatData,
          selectedChatType,
        } = useChatStore.getState();

        // Add user to blocked by list
        addBlockedByUser(blockerId);

        // If the current chat is with this user, update the selected chat data
        // with block information to force UI updates
        if (
          selectedChatType === "friend" &&
          selectedChatData &&
          selectedChatData._id === blockerId
        ) {
          // Update the chat data with block status to trigger UI update
          setSelectedChatData({
            ...selectedChatData,
            _isBlockedByUser: true,
            _blockTimestamp: Date.now(),
          });
        }

        toast.info(t("block.youWereBlocked"));
      });

      // Similar enhancement for the unblockedByUser event
      newSocket.on("unblockedByUser", (data) => {
        const { unblockerId } = data;

        // Get state updating methods from the store
        const {
          removeBlockedByUser,
          setSelectedChatData,
          selectedChatData,
          selectedChatType,
        } = useChatStore.getState();

        // Remove user from blocked by list
        removeBlockedByUser(unblockerId);

        // If the current chat is with this user, update the chat data
        // with block information to force UI updates
        if (
          selectedChatType === "friend" &&
          selectedChatData &&
          selectedChatData._id === unblockerId
        ) {
          // Update the chat data with block status to trigger UI update
          setSelectedChatData({
            ...selectedChatData,
            _isBlockedByUser: false,
            _blockTimestamp: Date.now(),
          });
        }

        toast.info(t("block.youWereUnblocked"));
      });

      newSocket.on(
        "removedFromGroup",
        ({ groupId, group, groupName, removedBy }) => {
          const {
            updateGroup,
            selectedChatType,
            selectedChatData,
            addSystemMessage,
          } = useChatStore.getState();

          // Update group in store with isActive: false and userRemoved: true
          updateGroup(groupId, {
            isActive: false,
            userRemoved: true,
          });

          // If the user is viewing the group they were removed from
          if (
            selectedChatType === "group" &&
            selectedChatData?._id === groupId
          ) {
            addSystemMessage({
              groupId,
              content: t("notifications.youWereRemovedFromGroup"),
              timestamp: new Date(),
            });

            // Update selectedChatData with isActive: false and userRemoved: true
            useChatStore.setState({
              selectedChatData: {
                ...selectedChatData,
                isActive: false,
                userRemoved: true,
              },
            });
          } else {
            // Otherwise show a toast notification
            toast.error(t("notifications.removedFromGroup", { groupName }));
          }
        }
      );

      newSocket.on("leftGroup", ({ groupId, group, groupName }) => {
        const {
          updateGroup,
          selectedChatType,
          selectedChatData,
          addSystemMessage,
        } = useChatStore.getState();

        // Explicitly set both flags
        updateGroup(groupId, {
          isActive: false,
          userRemoved: false,
          userLeft: true,
        });

        // If the user is viewing the group, also update the selected chat state
        if (selectedChatType === "group" && selectedChatData?._id === groupId) {
          useChatStore.setState({
            selectedChatData: {
              ...selectedChatData,
              isActive: false,
              userRemoved: false,
              userLeft: true,
            },
          });

          // Add a system message
          addSystemMessage({
            groupId,
            content: t("notifications.youLeftGroup"),
            timestamp: new Date(),
          });
        } else {
          toast.info(t("notifications.youLeftGroup", { groupName }));
        }
      });

      newSocket.on(
        "userLeftGroup",
        ({ groupId, userId, wasAdmin, newAdminId, groupName }) => {
          const {
            updateGroup,
            addSystemMessage,
            selectedChatType,
            selectedChatData,
          } = useChatStore.getState();

          // If we're viewing this group, show a system message
          if (
            selectedChatType === "group" &&
            selectedChatData?._id === groupId
          ) {
            // Get information about the user who left
            const { user } = useAuthStore.getState();

            // Different message if they were admin and passed the role
            const message =
              wasAdmin && newAdminId === user._id
                ? t("notifications.userLeftGroupAndYouAreNewAdmin", {
                    userName: userId,
                  })
                : t("notifications.userLeftGroup", { userName: userId });

            addSystemMessage({
              groupId,
              content: message,
              timestamp: new Date(),
            });
          } else {
            // Otherwise, show a toast notification
            toast.info(
              t("notifications.userLeftGroup", { userName: userId, groupName })
            );
          }

          // Update the group's member list, but only if we have the group data
          if (
            selectedChatType === "group" &&
            selectedChatData?._id === groupId
          ) {
            // Remove the user from the member list
            const updatedMembers = selectedChatData.members.filter(
              (member) => member._id !== userId
            );

            // If the user was admin and there's a new admin, update that too
            let updatedAdmin = selectedChatData.admin;
            if (wasAdmin && newAdminId) {
              // Find the new admin among the members
              updatedAdmin =
                updatedMembers.find((member) => member._id === newAdminId) ||
                updatedAdmin;
            }

            updateGroup(groupId, {
              members: updatedMembers,
              admin: updatedAdmin,
            });
          }
        }
      );

      newSocket.on("messageRejected", ({ groupId, reason }) => {
        toast.error(t("chat.messageRejected"));

        // If the current chat is the group for which the message was rejected, force an update
        const { selectedChatType, selectedChatData, updateGroup } =
          useChatStore.getState();
        if (selectedChatType === "group" && selectedChatData?._id === groupId) {
          // Force update of the group with isActive: false and userRemoved: true
          updateGroup(groupId, {
            isActive: false,
            userRemoved: true,
          });

          useChatStore.setState({
            selectedChatData: {
              ...selectedChatData,
              isActive: false,
              userRemoved: true,
            },
          });
        }
      });

      newSocket.on("groupCreated", (createdGroup) => {
        // Add the created group to the chat store
        addGroup(createdGroup);
      });

      newSocket.on("groupDeleted", async ({ groupId }) => {
        const {
          updateGroup,
          selectedChatType,
          selectedChatData,
          addSystemMessage,
        } = useChatStore.getState();

        // Instead of removing the group, mark it as deleted
        updateGroup(groupId, {
          isDeleted: true,
          deletedAt: new Date(),
        });

        // Add system message if this is the currently selected group
        if (selectedChatType === "group" && selectedChatData?._id === groupId) {
          addSystemMessage({
            groupId,
            content: t("notifications.groupDeletedByAdmin"),
            timestamp: new Date(),
            isSystem: true,
          });
        }

        // Notify the user
        toast.info(t("notifications.groupDeleted"));
      });

      newSocket.on("addedToGroup", ({ group }) => {
        const { groups, addGroup, updateGroup } = useChatStore.getState();

        // Check if the group already exists
        const existingGroup = groups.find((g) => g._id === group._id);

        if (!existingGroup) {
          // New group, add to the list
          addGroup({
            ...group,
            isActive: true,
            userRemoved: false,
          });
        } else {
          // Existing group, update its state
          updateGroup(group._id, {
            isActive: true,
            userRemoved: false,
            members: group.members,
          });
        }

        // Show a notification
        toast.success(
          t("notifications.addedToGroup", { groupName: group.name })
        );
      });

      newSocket.on("groupUpdated", ({ group, action, newMemberIds }) => {
        const { updateGroup } = useChatStore.getState();

        if (action === "membersAdded") {
          // Update the group in the list
          updateGroup(group._id, { members: group.members });

          // Show a subtle notification
          toast.info(
            t("notifications.membersAddedToGroup", { groupName: group.name })
          );
        }
      });

      // Initial fetch
      newSocket.emit("fetchUnreadCounts", user._id);

      // Clean up on unmount
      return () => {
        if (newSocket) {
          newSocket.off("connect");
          newSocket.off("profileImageUpdated");
          newSocket.off("fullUnreadMessagesState");
          newSocket.off("fullUnreadGroupMessagesState");
          newSocket.off("unreadMessagesState");
          newSocket.off("unreadGroupMessagesState");
          newSocket.off("resetSingleGroupUnreadCountAck");
          newSocket.off("receiveMessage");
          newSocket.off("receiveGroupMessage");
          newSocket.off("userStatusUpdate");
          newSocket.off("groupCreated");
          newSocket.off("addedToGroup");
          newSocket.off("blockedByUser");
          newSocket.off("unblockedByUser");

          if (newSocket && newSocket.connected) {
            newSocket.disconnect();
          } else if (newSocket) {
            // If not connected but exists, still try to clean up resources
            newSocket.disconnect();
          }
        }
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setChatStoreSocket(null);
      }
    }
  }, [userId, setChatStoreSocket, t]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

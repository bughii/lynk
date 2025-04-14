import { create } from "zustand";
import axios from "axios";
import { persist, createJSONStorage } from "zustand/middleware";

const API_URL = "http://localhost:9001/api/groups";

// A persistent store for chat state including unread message counts
export const useChatStore = create(
  persist(
    (set, get) => ({
      selectedChatType: undefined, // Current chat type (direct/group)
      selectedChatData: undefined, // Currently selected chat data
      selectedChatMessages: [], // Messages in the selected chat
      directMessagesFriends: [], // List of friends for direct messages
      groups: [], // List of groups for group messages
      unreadMessagesCount: {}, // Unread messages count for direct messages
      unreadGroupMessagesCount: {}, // Unread messages count for group messages
      socket: null, // Socket connection to the server
      blockedUsers: [], // Users blocked by the current user
      blockedByUsers: [], // Users who have blocked the current user

      // Chat customization options
      chatColors: {
        sentMessageColor: "#3B82F6",
        receivedMessageColor: "#8B5CF6",
        fontSize: "medium",
      },
      language: "en",

      // Socket accessor/setter
      setSocket: (socket) => set({ socket }),

      // Block-related methods
      setBlockedUsers: (blockedUsers) => set({ blockedUsers }),
      setBlockedByUsers: (blockedByUsers) => set({ blockedByUsers }),

      // Refresh the selected chat data to force a re-render.
      // This function only updates the selected chat object (when chatting with a friend)
      // by appending a new _refreshTimestamp.
      refreshSelectedChat: () => {
        const { selectedChatType, selectedChatData } = get();
        if (selectedChatType === "friend" && selectedChatData) {
          set({
            selectedChatData: {
              ...selectedChatData,
              _refreshTimestamp: Date.now(),
            },
          });
        }
      },

      // Block management methods
      addBlockedUser: (userId) =>
        set((state) => {
          // Only add if not already in the list
          if (!state.blockedUsers.includes(userId)) {
            return {
              blockedUsers: [...state.blockedUsers, userId],
            };
          }
          return state;
        }),

      removeBlockedUser: (userId) =>
        set((state) => ({
          blockedUsers: state.blockedUsers.filter((id) => id !== userId),
        })),

      addBlockedByUser: (userId) =>
        set((state) => {
          // Only add if not already in the list
          if (!state.blockedByUsers.includes(userId)) {
            return {
              blockedByUsers: [...state.blockedByUsers, userId],
            };
          }
          return state;
        }),

      removeBlockedByUser: (userId) =>
        set((state) => ({
          blockedByUsers: state.blockedByUsers.filter((id) => id !== userId),
        })),

      // Merging helper for unread counts (takes max values)
      mergeUnreadCounts: (localCount, serverCount) => {
        // Create a new object for the merged result
        const mergedCount = { ...serverCount };
        // For each key in localCount, take the max value between local and server
        Object.keys(localCount).forEach((key) => {
          const localValue = parseInt(localCount[key] || 0);
          const serverValue = parseInt(serverCount[key] || 0);
          mergedCount[key] = Math.max(localValue, serverValue);
        });
        return mergedCount;
      },

      // Reset unread count for direct messages
      resetUnreadCount: (senderId) => {
        if (!senderId) {
          console.warn("Cannot reset unread count: No sender ID provided");
          return;
        }
        const socket = get().socket;
        // Update local state immediately
        set((state) => {
          const newCount = { ...state.unreadMessagesCount };
          delete newCount[senderId];

          // Notify server about this reset if socket exists
          if (socket && socket.connected) {
            console.log(
              `Notifying server to reset count for sender: ${senderId}`
            );
            socket.emit("resetSingleUnreadCount", { senderId });
          }
          return { unreadMessagesCount: newCount };
        });
      },

      // Reset unread count for group messages
      resetGroupUnreadCount: (groupId) => {
        if (!groupId) {
          console.warn("Cannot reset group unread count: No group ID provided");
          return;
        }
        const socket = get().socket;
        // Update local state immediately
        set((state) => {
          const newCount = { ...state.unreadGroupMessagesCount };
          delete newCount[groupId];

          // Notify server about this reset if socket exists
          if (socket && socket.connected) {
            console.log(
              `Notifying server to reset count for group: ${groupId}`
            );
            socket.emit("resetSingleGroupUnreadCount", { groupId });
          }
          return { unreadGroupMessagesCount: newCount };
        });
      },

      // Initialize the socket connection
      initializeSocket: (userId) => {
        // Moved the handling to SocketContext
        console.log("Socket initialization is now handled by SocketContext");
      },

      // Sync unread counts with the server
      syncUnreadMessagesWithServer: () => {
        const socket = get().socket;
        const { unreadMessagesCount, unreadGroupMessagesCount } = get();
        if (socket && socket.connected) {
          console.log("Manually syncing unread counts with server");
          socket.emit("syncUnreadCounts", {
            unreadMessagesCount,
            unreadGroupMessagesCount,
          });
        } else {
          console.warn("Cannot sync counts - socket not connected");
        }
      },

      // Increment unread count for direct messages
      incrementUnreadCount: (senderId) => {
        set((state) => {
          const newCount = {
            ...state.unreadMessagesCount,
            [senderId]: (state.unreadMessagesCount[senderId] || 0) + 1,
          };
          return { unreadMessagesCount: newCount };
        });
      },

      // Increment unread count for group messages
      incrementGroupUnreadCount: (groupId) => {
        console.log(`Incrementing local unread count for group: ${groupId}`);
        set((state) => {
          const newCount = {
            ...state.unreadGroupMessagesCount,
            [groupId]: (state.unreadGroupMessagesCount[groupId] || 0) + 1,
          };
          return { unreadGroupMessagesCount: newCount };
        });
      },

      // Update chat appearance settings
      updateChatColors: (colors) =>
        set((state) => ({
          chatColors: { ...state.chatColors, ...colors },
        })),

      // Set UI language
      setLanguage: (language) => set({ language }),

      // Set state methods for groups, selected chat, etc.
      setGroups: (newGroups) => set({ groups: newGroups }),
      setSelectedChatType: (selectedChatType) => set({ selectedChatType }),
      setSelectedChatData: (selectedChatData) => set({ selectedChatData }),
      setSelectedChatMessages: (selectedChatMessages) =>
        set({ selectedChatMessages }),
      setDirectMessagesFriends: (directMessagesFriends) =>
        set({ directMessagesFriends }),

      setUnreadMessagesCount: (newCount) =>
        set({ unreadMessagesCount: newCount }),
      setUnreadGroupMessagesCount: (newCount) =>
        set({ unreadGroupMessagesCount: newCount }),

      setUnreadGroupMessagesState: (newCount) =>
        set({ unreadGroupMessagesCount: newCount }),

      // Add a group to the list
      addGroup: (group) =>
        set((state) => ({
          groups: [group, ...state.groups],
        })),

      // Close the current chat
      closeChat: () =>
        set({
          selectedChatData: undefined,
          selectedChatType: undefined,
          selectedChatMessages: [],
        }),

      // Add a message to the current chat
      addMessage: (message) => {
        const selectedChatMessages = get().selectedChatMessages;
        const selectedChatType = get().selectedChatType;
        set({
          selectedChatMessages: [
            ...selectedChatMessages,
            {
              ...message,
              recipient:
                selectedChatType === "group"
                  ? message.recipient || null
                  : message.recipient?._id || null,
              sender:
                selectedChatType === "group"
                  ? message.sender || null
                  : message.sender?._id || null,
            },
          ],
        });
      },

      // Fetch user groups from the server
      fetchUserGroups: async () => {
        try {
          const response = await axios.get(`${API_URL}/get-user-groups`);
          if (response.data.groups) {
            const groupsWithActive = response.data.groups.map((group) => ({
              ...group,
              isActive: true,
            }));
            set({ groups: groupsWithActive });
          }
          return response;
        } catch (error) {
          console.error("Error fetching user groups:", error);
        }
      },

      // Calculate total unread count across all chats
      getTotalUnreadCount: () => {
        const { unreadMessagesCount, unreadGroupMessagesCount } = get();
        const directCount = Object.values(unreadMessagesCount).reduce(
          (total, count) => total + count,
          0
        );
        const groupCount = Object.values(unreadGroupMessagesCount).reduce(
          (total, count) => total + count,
          0
        );
        return directCount + groupCount;
      },

      // Debug state
      debugState: () => {
        const state = get();
        console.log("Current Chat Store State:", {
          selectedChatData: state.selectedChatData,
          selectedChatType: state.selectedChatType,
          unreadMessagesCount: state.unreadMessagesCount,
          unreadGroupMessagesCount: state.unreadGroupMessagesCount,
          totalUnreadCount: state.getTotalUnreadCount(),
        });
      },

      // Update group ordering after new message
      updateGroupList: (message) => {
        const groups = get().groups;
        const data = groups.find((group) => group._id === message.groupId);
        const index = groups.findIndex(
          (group) => group._id === message.groupId
        );
        if (index !== -1 && index !== undefined) {
          groups.splice(index, 1);
          groups.unshift(data);
        }
      },

      // Remove a group completely
      removeGroup: (groupId) =>
        set((state) => ({
          groups: state.groups.filter((group) => group._id !== groupId),
          selectedChatType:
            state.selectedChatType === "group" &&
            state.selectedChatData?._id === groupId
              ? undefined
              : state.selectedChatType,
          selectedChatData:
            state.selectedChatType === "group" &&
            state.selectedChatData?._id === groupId
              ? undefined
              : state.selectedChatData,
          selectedChatMessages:
            state.selectedChatType === "group" &&
            state.selectedChatData?._id === groupId
              ? []
              : state.selectedChatMessages,
        })),

      // Mark a group as deleted (but keep in list)
      markGroupAsDeleted: (groupId) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group._id === groupId
              ? { ...group, isDeleted: true, deletedAt: new Date() }
              : group
          ),
        })),

      // Mark a group as inactive
      markGroupAsInactive: (groupId) =>
        set((state) => {
          const groupIndex = state.groups.findIndex(
            (group) => group._id === groupId
          );
          if (groupIndex === -1) return state;
          const updatedGroups = [...state.groups];
          updatedGroups[groupIndex] = {
            ...updatedGroups[groupIndex],
            isActive: false,
          };
          const updatedSelectedChatData =
            state.selectedChatType === "group" &&
            state.selectedChatData?._id === groupId
              ? { ...state.selectedChatData, isActive: false }
              : state.selectedChatData;
          return {
            groups: updatedGroups,
            selectedChatData: updatedSelectedChatData,
          };
        }),

      // Add a system message to the current chat
      addSystemMessage: (message) =>
        set((state) => ({
          selectedChatMessages: [
            ...state.selectedChatMessages,
            {
              ...message,
              isSystem: true,
            },
          ],
        })),

      // Update a group with new properties
      updateGroup: (groupId, updates) =>
        set((state) => {
          const groupIndex = state.groups.findIndex(
            (group) => group._id === groupId
          );
          if (groupIndex === -1) return state;
          const updatedGroups = [...state.groups];
          updatedGroups[groupIndex] = {
            ...updatedGroups[groupIndex],
            ...updates,
          };
          const updatedSelectedChatData =
            state.selectedChatType === "group" &&
            state.selectedChatData?._id === groupId
              ? { ...state.selectedChatData, ...updates }
              : state.selectedChatData;
          return {
            groups: updatedGroups,
            selectedChatData: updatedSelectedChatData,
          };
        }),
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        chatColors: state.chatColors,
        language: state.language,
        unreadMessagesCount: state.unreadMessagesCount,
        unreadGroupMessagesCount: state.unreadGroupMessagesCount,
        blockedUsers: state.blockedUsers,
        blockedByUsers: state.blockedByUsers,
      }),
    }
  )
);

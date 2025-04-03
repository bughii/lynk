import { create } from "zustand";
import axios from "axios";
import { persist, createJSONStorage } from "zustand/middleware";
import io from "socket.io-client";

const API_URL = "http://localhost:9001/api/groups";

// A persistent store was needed to keep the unread messages count saved in the local storage of the browser.
// The local persistence is useful but not enough to manage the received messages when an user is offline
// This store is synchronized with both client (SocketContext) and server (socket.js)

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

      // Method to set the socket connection in the store
      setSocket: (socket) => {
        set({ socket });
      },

      // Chat customization options
      chatColors: {
        sentMessageColor: "#3B82F6",
        receivedMessageColor: "#8B5CF6",
        fontSize: "medium",
      },
      language: "en",

      // This ensure synchronization of unread messages count across devices
      // Using the max ensures all unread messages are counted, avoiding data loss or undercounting
      mergeUnreadCounts: (localCount, serverCount) => {
        // Takes the server count as the base
        const mergedCount = { ...serverCount };
        // Merge local count with server count by taking the maximum value between the two
        Object.entries(localCount).forEach(([key, localValue]) => {
          mergedCount[key] = Math.max(localValue, serverCount[key] || 0);
        });
        return mergedCount;
      },

      // Initialize the socket connection and listen for events
      initializeSocket: (userId) => {
        const socket = io("http://localhost:9001", {
          query: { userId },
          withCredentials: true,
        });

        // Listen for connection event
        socket.on("connect", () => {
          // Fetch unread counts from server during connection
          socket.emit("fetchUnreadCounts", userId);
        });

        // Use the new merge method for unread messages
        socket.on("unreadMessagesState", (serverUnreadMessages) => {
          const localUnreadMessages = get().unreadMessagesCount || {};

          const mergedUnreadMessages = get().mergeUnreadCounts(
            localUnreadMessages,
            serverUnreadMessages
          );

          set({ unreadMessagesCount: mergedUnreadMessages });
        });

        // Similar approach for group messages
        socket.on("unreadGroupMessagesState", (serverUnreadGroupMessages) => {
          const localUnreadGroups = get().unreadGroupMessagesCount || {};

          const mergedUnreadGroups = get().mergeUnreadCounts(
            localUnreadGroups,
            serverUnreadGroupMessages
          );

          set({ unreadGroupMessagesCount: mergedUnreadGroups });
        });

        set({ socket });
      },

      // Sends local unread messages count to the server for synchronization
      syncUnreadMessagesWithServer: () => {
        const socket = get().socket;
        const { unreadMessagesCount, unreadGroupMessagesCount } = get();

        if (socket) {
          // Emit current unread counts to server for synchronization
          socket.emit("syncUnreadCounts", {
            unreadMessagesCount,
            unreadGroupMessagesCount,
          });
        }
      },

      resetUnreadCount: (senderId) => {
        const socket = get().socket;
        if (socket) {
          // Notify the server to reset the unread count for the sender
          socket.emit("resetUnreadCount", {
            senderId,
            timestamp: Date.now(), // Add a timestamp to ensure latest reset
          });

          set((state) => {
            const newCount = { ...state.unreadMessagesCount };

            // Remove the sender from the unread messages count
            delete newCount[senderId];

            return { unreadMessagesCount: newCount };
          });
        }
      },

      resetGroupUnreadCount: (groupId) => {
        const socket = get().socket;
        if (socket) {
          socket.emit("resetGroupUnreadCount", {
            groupId,
            timestamp: Date.now(), // Add a timestamp to ensure latest reset
          });

          set((state) => {
            const newCount = { ...state.unreadGroupMessagesCount };

            // Remove the group from the unread group messages count
            delete newCount[groupId];

            return { unreadGroupMessagesCount: newCount };
          });
        }
      },

      incrementUnreadCount: (senderId) => {
        const socket = get().socket;
        if (socket) {
          socket.emit("incrementUnreadCount", senderId);
        }
        set((state) => {
          const newCount = {
            ...state.unreadMessagesCount,
            [senderId]: (state.unreadMessagesCount[senderId] || 0) + 1,
          };
          return {
            unreadMessagesCount: newCount,
            syncUnreadMessagesWithServer: true,
          };
        });
      },

      incrementGroupUnreadCount: (groupId) => {
        const socket = get().socket;
        if (socket) {
          socket.emit("incrementGroupUnreadCount", groupId);
        }
        set((state) => {
          const newCount = {
            ...state.unreadGroupMessagesCount,
            [groupId]: (state.unreadGroupMessagesCount[groupId] || 0) + 1,
          };
          return {
            unreadGroupMessagesCount: newCount,
            syncUnreadMessagesWithServer: true,
          };
        });
      },

      updateChatColors: (colors) =>
        set((state) => ({
          chatColors: { ...state.chatColors, ...colors },
        })),

      setLanguage: (language) => set({ language }),

      setGroups: (newGroups) =>
        set((state) => {
          console.log("Setting groups in store:", newGroups);
          return { groups: newGroups };
        }),

      setSelectedChatType: (selectedChatType) => set({ selectedChatType }),
      setSelectedChatData: (selectedChatData) => set({ selectedChatData }),

      setSelectedChatMessages: (selectedChatMessages) =>
        set({ selectedChatMessages }),

      setDirectMessagesFriends: (directMessagesFriends) =>
        set({ directMessagesFriends }),

      addGroup: (group) =>
        set((state) => ({
          groups: [...state.groups, group],
        })),

      closeChat: () =>
        set({
          selectedChatData: undefined,
          selectedChatType: undefined,
          selectedChatMessages: [],
        }),

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
                  ? message.recipient || null // Handle missing recipient for groups
                  : message.recipient?._id || null, // Handle direct messages safely
              sender:
                selectedChatType === "group"
                  ? message.sender || null // Use sender directly for groups
                  : message.sender?._id || null, // Handle direct messages safely
            },
          ],
        });

        console.log("Message added to chat:", message);
      },

      fetchUserGroups: async () => {
        try {
          const response = await axios.get(`${API_URL}/get-user-groups`);
          if (response.data.groups) {
            // Aggiungi isActive: true a tutti i gruppi caricati
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

      setUnreadMessagesCount: (newCount) =>
        set({ unreadMessagesCount: newCount }),

      setUnreadGroupMessagesState: (unreadState) =>
        set({ unreadGroupMessagesCount: unreadState }),

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

      debugState: () => {
        const state = get();
        console.log("Current Chat Store State:", {
          selectedChatData: state.selectedChatData,
          selectedChatType: state.selectedChatType,
          unreadMessagesCount: state.unreadMessagesCount,
          totalUnreadCount: state.getTotalUnreadCount(),
        });
      },

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

      removeGroup: (groupId) =>
        set((state) => ({
          groups: state.groups.filter((group) => group._id !== groupId),
          // Se la chat selezionata è quella rimossa, chiudi la chat
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

      markGroupAsDeleted: (groupId) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group._id === groupId
              ? { ...group, isDeleted: true, deletedAt: new Date() }
              : group
          ),
        })),

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

          // Se la chat selezionata è quella disattivata, aggiorna anche selectedChatData
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

          // Se la chat selezionata è quella aggiornata, aggiorna anche selectedChatData
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
      }),
      onRehydrate: (state) => {
        // Retrieve the stored state from localstorage
        const storedState =
          JSON.parse(localStorage.getItem("chat-storage")) || {};

        // Extract the unread messages count from the stored state
        const localUnreadMessages = storedState.unreadMessagesCount || {};
        const localUnreadGroupMessages =
          storedState.unreadGroupMessagesCount || {};

        // Temporarily store local data in memory without setting it to the store
        // Until the server state is received and merged
        state.rehydratedUnreadMessages = localUnreadMessages;
        state.rehydratedUnreadGroupMessages = localUnreadGroupMessages;

        console.log("Temporarily storing rehydrated counts for later merge...");
      },
    }
  )
);

import { create } from "zustand";
import axios from "axios";
import { persist, createJSONStorage } from "zustand/middleware";

const API_URL = "http://localhost:9001/api/groups";

// A persistent store was needed to keep the unread messages count saved in the local storage of the browser.
// The local persistence is useful but not enough to manage the received messages when an user is offline

// This store is synchronized with both client (SocketContext) and server (socket.js)

export const useChatStore = create(
  persist(
    (set, get) => ({
      selectedChatType: undefined,
      selectedChatData: undefined,
      selectedChatMessages: [],
      directMessagesFriends: [],
      groups: [],
      unreadMessagesCount: {},

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

      addGroup: (newGroup) =>
        set((state) => {
          console.log("Adding new group to store:", newGroup);
          const updatedGroups = [...state.groups, newGroup];
          return { groups: updatedGroups };
        }),

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
                selectedChatType === "channel"
                  ? message.recipient
                  : message.recipient._id,
              sender:
                selectedChatType === "channel"
                  ? message.sender
                  : message.sender._id,
            },
          ],
        });
      },

      fetchUserGroups: async () => {
        try {
          const response = await axios.get(`${API_URL}/get-user-groups`);
          if (response.data.groups) {
            console.log(response.data.groups);
          }
          set({ groups: response.data.groups });
          return response;
        } catch (error) {
          console.error("Error fetching user groups:", error);
        }
      },

      incrementUnreadCount: (senderId) =>
        set((state) => {
          const newCount = {
            ...state.unreadMessagesCount,
            [senderId]: (state.unreadMessagesCount[senderId] || 0) + 1,
          };
          return { unreadMessagesCount: newCount };
        }),

      resetUnreadCount: (senderId) =>
        set((state) => {
          const newCount = {
            ...state.unreadMessagesCount,
            [senderId]: 0,
          };
          return { unreadMessagesCount: newCount };
        }),

      setUnreadMessagesCount: (newCount) =>
        set({ unreadMessagesCount: newCount }),

      getTotalUnreadCount: () => {
        const { unreadMessagesCount } = get();
        return Object.values(unreadMessagesCount).reduce(
          (total, count) => total + count,
          0
        );
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
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        unreadMessagesCount: state.unreadMessagesCount,
      }),
    }
  )
);

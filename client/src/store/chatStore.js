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
      unreadGroupMessagesCount: {},

      chatColors: {
        sentMessageColor: "#3B82F6",
        receivedMessageColor: "#8B5CF6",
        fontSize: "medium",
      },
      language: "en",

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
                  ? message.recipient
                  : message.recipient._id,
              sender:
                selectedChatType === "group"
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

      incrementGroupUnreadCount: (groupId) =>
        set((state) => {
          const newCount = {
            ...state.unreadGroupMessagesCount,
            [groupId]: (state.unreadGroupMessagesCount[groupId] || 0) + 1,
          };
          return { unreadGroupMessagesCount: newCount };
        }),

      resetUnreadCount: (senderId) =>
        set((state) => {
          const newCount = {
            ...state.unreadMessagesCount,
            [senderId]: 0,
          };
          return { unreadMessagesCount: newCount };
        }),

      resetGroupUnreadCount: (groupId) =>
        set((state) => {
          const newCount = {
            ...state.unreadGroupMessagesCount,
            [groupId]: 0,
          };
          return { unreadGroupMessagesCount: newCount };
        }),

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
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        unreadMessagesCount: state.unreadMessagesCount,
        unreadGroupMessagesCount: state.unreadGroupMessagesCount,
        chatColors: state.chatColors,
        language: state.language,
      }),
    }
  )
);

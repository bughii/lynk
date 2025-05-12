import { create } from "zustand";
import axios from "axios";
import { persist, createJSONStorage } from "zustand/middleware";
import { HOST } from "@/utils/constants";
import { getAvatar } from "@/lib/utils";

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
        if (!senderId) return;

        const socket = get().socket;

        // Update the local state immediately
        set((state) => {
          const newCount = { ...state.unreadMessagesCount };
          delete newCount[senderId];
          return { unreadMessagesCount: newCount };
        });

        // Notify the server only if the socket is connected
        if (socket && socket.connected) {
          socket.emit("resetSingleUnreadCount", { senderId });
        }
      },

      resetGroupUnreadCount: (groupId) => {
        if (!groupId) return;

        const socket = get().socket;

        // Update the local state immediately
        set((state) => {
          const newCount = { ...state.unreadGroupMessagesCount };
          delete newCount[groupId];
          return { unreadGroupMessagesCount: newCount };
        });

        // Notify the server only if the socket is connected
        if (socket && socket.connected) {
          socket.emit("resetSingleGroupUnreadCount", { groupId });
        }
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

      updateUserProfileImage: (userId, newImagePath) => {
        if (!userId) return; // Guard clause

        // Determine the correct path to store
        let pathToStore = null; // Default to null
        let finalImageUrlForDisplay = null; // The full URL or asset path for immediate display

        if (newImagePath) {
          if (
            newImagePath.startsWith("http") ||
            newImagePath.startsWith("data:")
          ) {
            finalImageUrlForDisplay = newImagePath;
            // Attempt to determine relative path for storage
            if (newImagePath.startsWith(`${HOST}/`)) {
              pathToStore = newImagePath.substring(HOST.length + 1);
            } else if (
              !newImagePath.startsWith("data:") &&
              !newImagePath.startsWith("/assets/")
            ) {
              pathToStore = newImagePath;
            }
          } else if (newImagePath.startsWith("/assets/")) {
            // Handle avatar asset paths directly
            finalImageUrlForDisplay = newImagePath;
            pathToStore = null; // Store null when it's an avatar asset path
          } else {
            pathToStore = newImagePath.startsWith("/")
              ? newImagePath.substring(1)
              : newImagePath;
            finalImageUrlForDisplay = `${HOST}/${pathToStore}`;
          }
        } else {
          // If newImagePath is null/undefined, means image removed, likely fallback to avatar
          finalImageUrlForDisplay = getAvatar(0); // getAvatar(0) gets default
          pathToStore = null; // Store null for image
        }

        set((state) => {
          const updates = {};

          // 1. Update direct messages friends list
          if (state.directMessagesFriends.length > 0) {
            updates.directMessagesFriends = state.directMessagesFriends.map(
              (friend) =>
                friend._id === userId
                  ? {
                      ...friend,
                      image: pathToStore,
                      avatar: pathToStore ? undefined : friend.avatar ?? 0,
                    }
                  : friend
            );
          }

          // 2. Update in groups (members and admin)
          if (state.groups.length > 0) {
            updates.groups = state.groups.map((group) => ({
              ...group,
              members:
                group.members?.map((member) =>
                  member._id === userId
                    ? {
                        ...member,
                        image: pathToStore,
                        avatar: pathToStore ? undefined : member.avatar ?? 0,
                      }
                    : member
                ) || [],
              admin:
                group.admin?._id === userId
                  ? {
                      ...group.admin,
                      image: pathToStore,
                      avatar: pathToStore ? undefined : group.admin.avatar ?? 0,
                    }
                  : group.admin,
            }));
          }

          // 3. Update in currently selected chat
          if (
            state.selectedChatType === "friend" &&
            state.selectedChatData &&
            state.selectedChatData._id === userId
          ) {
            updates.selectedChatData = {
              ...state.selectedChatData,
              image: pathToStore,
              avatar: pathToStore
                ? undefined
                : state.selectedChatData.avatar ?? 0,
            };
          } else if (
            state.selectedChatType === "group" &&
            state.selectedChatData // Check if selectedChatData exists
          ) {
            // Also update admin/member info if the group is selected
            let groupUpdated = false;
            const updatedMembers =
              state.selectedChatData.members?.map((member) => {
                if (member._id === userId) {
                  groupUpdated = true;
                  return {
                    ...member,
                    image: pathToStore,
                    avatar: pathToStore ? undefined : member.avatar ?? 0,
                  };
                }
                return member;
              }) || [];
            const updatedAdmin =
              state.selectedChatData.admin?._id === userId
                ? {
                    ...state.selectedChatData.admin,
                    image: pathToStore,
                    avatar: pathToStore
                      ? undefined
                      : state.selectedChatData.admin.avatar ?? 0,
                  }
                : state.selectedChatData.admin;
            if (state.selectedChatData.admin?._id === userId)
              groupUpdated = true;

            if (groupUpdated) {
              updates.selectedChatData = {
                ...state.selectedChatData,
                members: updatedMembers,
                admin: updatedAdmin,
              };
            }
          }

          // 4. Update historical messages
          let messagesUpdated = false;
          const updatedMessages = state.selectedChatMessages.map((message) => {
            // Only update if message has a sender and sender._id matches
            if (message.sender && message.sender._id === userId) {
              messagesUpdated = true; // Flag that we made a change
              return {
                ...message,
                sender: {
                  ...message.sender,
                  image: pathToStore, // Update the image path
                  avatar: pathToStore ? undefined : message.sender.avatar ?? 0, // Update avatar index consistently
                },
              };
            }
            return message; // Return unchanged message if sender doesn't match
          });

          // Only update the selectedChatMessages state if changes were actually made
          if (messagesUpdated) {
            updates.selectedChatMessages = updatedMessages;
          }

          // Return all updates
          return updates;
        });
      },

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

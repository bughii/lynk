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

      newSocket.on(
        "removedFromGroup",
        ({ groupId, group, groupName, removedBy }) => {
          const {
            updateGroup,
            selectedChatType,
            selectedChatData,
            addSystemMessage,
          } = useChatStore.getState();

          console.log("Received removedFromGroup event:", {
            groupId,
            groupName,
          });

          // Aggiorna il gruppo nel store con isActive: false e userRemoved: true
          updateGroup(groupId, {
            isActive: false,
            userRemoved: true,
          });

          // Se l'utente sta visualizzando il gruppo da cui è stato rimosso
          if (
            selectedChatType === "group" &&
            selectedChatData?._id === groupId
          ) {
            addSystemMessage({
              groupId,
              content: t("notifications.youWereRemovedFromGroup"),
              timestamp: new Date(),
            });

            // Aggiorna selectedChatData con isActive: false e userRemoved: true
            useChatStore.setState({
              selectedChatData: {
                ...selectedChatData,
                isActive: false,
                userRemoved: true,
              },
            });
          } else {
            // Altrimenti mostra una notifica toast
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

        // Imposta esplicitamente entrambi i flag
        updateGroup(groupId, {
          isActive: false,
          userRemoved: false, // Assicurati che questo sia false
          userLeft: true, // E questo sia true
        });

        // Se l'utente sta visualizzando il gruppo, aggiorna anche lo stato della chat selezionata
        if (selectedChatType === "group" && selectedChatData?._id === groupId) {
          useChatStore.setState({
            selectedChatData: {
              ...selectedChatData,
              isActive: false,
              userRemoved: false,
              userLeft: true,
            },
          });

          // Aggiungi un messaggio di sistema
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

          // Se stiamo visualizzando questo gruppo, mostra un messaggio di sistema
          if (
            selectedChatType === "group" &&
            selectedChatData?._id === groupId
          ) {
            // Ottieni informazioni sull'utente che è uscito
            const { user } = useAuthStore.getState();

            // Messaggio differente se era admin e ha passato il ruolo
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
            // Altrimenti, mostra una notifica toast
            toast.info(
              t("notifications.userLeftGroup", { userName: userId, groupName })
            );
          }

          // Aggiorna la lista dei membri del gruppo, ma solo se abbiamo i dati del gruppo
          if (
            selectedChatType === "group" &&
            selectedChatData?._id === groupId
          ) {
            // Rimuovi l'utente dalla lista membri
            const updatedMembers = selectedChatData.members.filter(
              (member) => member._id !== userId
            );

            // Se l'utente era admin e c'è un nuovo admin, aggiorna anche quello
            let updatedAdmin = selectedChatData.admin;
            if (wasAdmin && newAdminId) {
              // Trova il nuovo admin tra i membri
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

        // Se la chat attuale è il gruppo per cui il messaggio è stato rifiutato, forza l'aggiornamento
        const { selectedChatType, selectedChatData, updateGroup } =
          useChatStore.getState();
        if (selectedChatType === "group" && selectedChatData?._id === groupId) {
          // Forza l'aggiornamento del gruppo con isActive: false e userRemoved: true
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

      newSocket.on("groupDeleted", async ({ groupId }) => {
        const {
          updateGroup,
          selectedChatType,
          selectedChatData,
          addSystemMessage,
        } = useChatStore.getState();

        console.log("Received groupDeleted event for:", groupId);

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
        console.log("Received addedToGroup event:", group);
        const { groups, addGroup, updateGroup } = useChatStore.getState();

        // Verifica se il gruppo esiste già
        const existingGroup = groups.find((g) => g._id === group._id);

        if (!existingGroup) {
          // Gruppo nuovo, aggiungi alla lista
          console.log("Adding new group to store:", group.name);
          addGroup({
            ...group,
            isActive: true,
            userRemoved: false,
          });
        } else {
          // Gruppo esistente, aggiorna lo stato
          console.log("Updating existing group in store:", group.name);
          updateGroup(group._id, {
            isActive: true,
            userRemoved: false,
            members: group.members,
          });
        }

        // Mostra una notifica
        toast.success(
          t("notifications.addedToGroup", { groupName: group.name })
        );
      });

      newSocket.on("groupUpdated", ({ group, action, newMemberIds }) => {
        const { updateGroup } = useChatStore.getState();

        if (action === "membersAdded") {
          // Aggiorna il gruppo nella lista
          updateGroup(group._id, { members: group.members });

          // Mostra una notifica discreta
          toast.info(
            t("notifications.membersAddedToGroup", { groupName: group.name })
          );
        }
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
          newSocket.off("addedToGroup");

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

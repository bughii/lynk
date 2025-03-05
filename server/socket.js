import { Server as SocketIOServer } from "socket.io";
import { Message } from "./models/MessagesModel.js";
import { User } from "./models/UserModel.js";
import { Group } from "./models/GroupModel.js";

// Setting up the server on which the websockets connections will be handled
const setupSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // A map which keeps track of userId and socketId.
  // Needed in order to know which socket is connected to which user
  const userSocketMap = new Map();

  // Handles the disconnection of a socket
  const disconnect = (socket) => {
    // Iterate through every pair of the map to find the userId associated with the disconnected socket
    for (const [userId, socketId] of userSocketMap.entries()) {
      // Check if the ID of the current socket is equal to the socket that's passed as an argument
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        io.emit("userStatusUpdate", { userId, isOnline: false });
        break;
      }
    }
  };

  // Handles the sending of a message
  const sendMessage = async (message) => {
    try {
      // Find socket connections for sender and recipient
      const senderSocketId = userSocketMap.get(message.sender);
      const recipientSocketId = userSocketMap.get(message.recipient);

      // Create the message in the database
      const createdMessage = await Message.create(message);

      // Populate the sender and recipient fields of the message
      const messageData = await Message.findById(createdMessage._id)
        .populate("sender", "id email username image avatar")
        .populate("recipient", "id email username image avatar");

      // Always emit to the sender, regardless of recipient's online status
      if (senderSocketId) {
        io.to(senderSocketId).emit("receiveMessage", messageData);
      }

      // Send to recipient if online, otherwise increment their unread count
      if (recipientSocketId) {
        // If recipient is online, send it in real time
        io.to(recipientSocketId).emit("receiveMessage", messageData);
      } else {
        // If recipient is offline, increment their unread count
        const user = await User.findById(message.recipient);

        if (user) {
          const currentCounts = new Map(
            Object.entries(user.unreadMessagesCount || {})
          );

          // Increment unread count for that specific sender
          currentCounts.set(
            message.sender,
            (currentCounts.get(message.sender) || 0) + 1
          );

          await User.findByIdAndUpdate(
            message.recipient,
            { unreadMessagesCount: Object.fromEntries(currentCounts) },
            { new: true }
          );
        }
      }
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  // Handles the sending of a group message
  const sendGroupMessage = async (message) => {
    try {
      // Message details
      const { groupId, sender, content, messageType, fileURL } = message;

      // Prima controlla se l'utente è membro del gruppo o è stato rimosso
      const group = await Group.findById(groupId);

      if (!group) {
        console.log(`Group ${groupId} not found`);
        const senderSocketId = userSocketMap.get(sender);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageRejected", {
            groupId,
            reason: "Group not found",
          });
        }
        return;
      }

      // Verifica se l'utente è ancora membro del gruppo
      const isMember =
        group.members.some(
          (member) => member.toString() === sender.toString()
        ) || group.admin.toString() === sender.toString();

      // Ottieni informazioni sull'utente per verificare se è stato rimosso dal gruppo
      const user = await User.findById(sender);
      const isRemovedFromGroup =
        user.removedGroups &&
        user.removedGroups.some(
          (item) =>
            item.groupId && item.groupId.toString() === groupId.toString()
        );

      // Se l'utente non è membro del gruppo o è stato rimosso, non inviare il messaggio
      if (!isMember || isRemovedFromGroup) {
        console.log(
          `Blocked message from ${sender} to group ${groupId}: User not in group or removed`
        );
        // Invia una notifica all'utente che non può inviare messaggi
        const senderSocketId = userSocketMap.get(sender);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageRejected", {
            groupId,
            reason: "User not in group or removed",
          });
        }
        return;
      }

      // Se l'utente è un membro valido, procedi con la creazione e l'invio del messaggio

      // Create the message in the database
      const createdMessage = await Message.create({
        sender,
        recipient: null,
        content,
        messageType,
        timestamp: Date.now(),
        fileURL,
      });

      // Populate the sender field of the message
      const messageData = await Message.findById(createdMessage._id)
        .populate("sender", "id email userName image avatar")
        .exec();

      // Update the group with the new message
      const updatedGroup = await Group.findByIdAndUpdate(
        groupId,
        { $push: { messages: messageData._id } },
        { new: true }
      ).populate("members admin");

      const finalData = { ...messageData._doc, groupId: updatedGroup._id };

      // Track which members are online vs offline
      const onlineMembers = new Set();
      const offlineMembers = [];

      // Crea un set di tutti gli ID membri per verificare se l'admin è già nei membri
      const memberIds = new Set(
        updatedGroup.members.map((m) => m._id.toString())
      );

      // Emit the message to all online group members
      updatedGroup.members.forEach((member) => {
        const memberSocketId = userSocketMap.get(member._id.toString());
        if (memberSocketId) {
          onlineMembers.add(member._id.toString());
          io.to(memberSocketId).emit("receiveGroupMessage", finalData);
        } else {
          // Member is offline, add to offline members list
          offlineMembers.push(member._id.toString());
        }
      });

      // Handle admin specially ONLY if not already included in members
      const adminId = updatedGroup.admin._id.toString();
      if (!memberIds.has(adminId)) {
        const adminSocketId = userSocketMap.get(adminId);
        if (adminSocketId) {
          onlineMembers.add(adminId);
          io.to(adminSocketId).emit("receiveGroupMessage", finalData);
        } else if (!onlineMembers.has(adminId)) {
          offlineMembers.push(adminId);
        }
      }

      // Increment unread count for offline members, but don't increment for the sender
      for (const memberId of offlineMembers) {
        // Skip incrementing for the sender of the message
        if (memberId === sender.toString()) continue;

        const user = await User.findById(memberId);
        if (user) {
          // Create a copy of the current unread group messages count
          const currentGroupCounts = { ...user.unreadGroupMessagesCount } || {};

          // Increment the count for this group
          currentGroupCounts[groupId] = (currentGroupCounts[groupId] || 0) + 1;

          // Update the user document with the new count
          await User.findByIdAndUpdate(
            memberId,
            { unreadGroupMessagesCount: currentGroupCounts },
            { new: true }
          );

          console.log(
            `Incremented unread count for group ${groupId} for offline member ${memberId}`
          );
        }
      }
    } catch (error) {
      console.error("Error in sendGroupMessage:", error);
    }
  };

  io.on("connection", async (socket) => {
    // Get the userId from the query parameter
    const userId = socket.handshake.query.userId;

    if (userId) {
      try {
        // Track the user's socket and set their online status
        userSocketMap.set(userId, socket.id);
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit("userStatusUpdate", { userId, isOnline: true });

        const user = await User.findById(userId);
        if (user) {
          socket.emit("unreadMessagesState", user.unreadMessagesCount || {});
          socket.emit(
            "unreadGroupMessagesState",
            user.unreadGroupMessagesCount || {}
          );
        }

        socket.on("syncUnreadCounts", async (data) => {
          try {
            const user = await User.findById(userId);

            if (user) {
              // Merge server counts with incoming client counts
              const serverPrivateCounts = user.unreadMessagesCount || {};
              const serverGroupCounts = user.unreadGroupMessagesCount || {};

              const mergedPrivateCounts = {
                ...serverPrivateCounts,
                ...data.unreadMessagesCount,
              };
              const mergedGroupCounts = {
                ...serverGroupCounts,
                ...data.unreadGroupMessagesCount,
              };

              // Take the maximum count for each sender/group
              Object.keys(data.unreadMessagesCount).forEach((key) => {
                mergedPrivateCounts[key] = Math.max(
                  serverPrivateCounts[key] || 0,
                  data.unreadMessagesCount[key]
                );
              });

              Object.keys(data.unreadGroupMessagesCount).forEach((key) => {
                mergedGroupCounts[key] = Math.max(
                  serverGroupCounts[key] || 0,
                  data.unreadGroupMessagesCount[key]
                );
              });

              // Update the database with merged counts
              await User.findByIdAndUpdate(userId, {
                unreadMessagesCount: mergedPrivateCounts,
                unreadGroupMessagesCount: mergedGroupCounts,
              });

              console.log("Merged unread counts saved to server:", {
                private: mergedPrivateCounts,
                groups: mergedGroupCounts,
              });

              // Send updated counts back to client
              socket.emit("unreadMessagesState", mergedPrivateCounts);
              socket.emit("unreadGroupMessagesState", mergedGroupCounts);
            }
          } catch (error) {
            console.error("Error syncing unread counts:", error);
          }
        });

        socket.on("fetchUnreadCounts", async (requestedUserId) => {
          try {
            const user = await User.findById(requestedUserId);

            const unreadMessagesCount = new Map(
              Object.entries(user?.unreadMessagesCount || {})
            );

            const unreadGroupMessagesCount = new Map(
              Object.entries(user?.unreadGroupMessagesCount || {})
            );

            console.log("Server-side unread messages for user:", {
              userId: requestedUserId,
              unreadMessagesCount: Object.fromEntries(unreadMessagesCount), // For logging clarity
              unreadGroupMessagesCount: Object.fromEntries(
                unreadGroupMessagesCount
              ),
            });

            if (user) {
              socket.emit(
                "unreadMessagesState",
                Object.fromEntries(unreadMessagesCount) // Send as plain object
              );
              socket.emit(
                "unreadGroupMessagesState",
                Object.fromEntries(unreadGroupMessagesCount)
              );
            }
          } catch (error) {
            console.error("Error fetching unread counts:", error);
          }
        });

        socket.on("newGroup", async (group) => {
          const populatedGroup = await Group.findById(group._id)
            .populate("members", "id email userName image avatar")
            .populate("admin", "id email userName image avatar");

          populatedGroup.members.forEach((member) => {
            const memberSocketId = userSocketMap.get(member._id.toString());
            if (memberSocketId) {
              io.to(memberSocketId).emit("groupCreated", populatedGroup);
            }
          });
        });

        socket.on("sendMessage", sendMessage);
        socket.on("sendGroupMessage", sendGroupMessage);

        socket.on("resetUnreadCount", async (data) => {
          const { senderId } = data;
          try {
            const user = await User.findById(userId);

            if (user && user.unreadMessagesCount) {
              // Create a copy of unread messages count
              const updatedUnreadCount = { ...user.unreadMessagesCount };

              // Remove the specific sender's unread count
              delete updatedUnreadCount[senderId];

              // Update user document
              await User.findByIdAndUpdate(userId, {
                unreadMessagesCount: updatedUnreadCount,
              });

              // Emit the updated state back to the client
              socket.emit("unreadMessagesState", updatedUnreadCount);

              console.log("Reset unread count:", {
                userId,
                senderId,
                updatedUnreadCount,
              });
            }
          } catch (error) {
            console.error("Error resetting unread count:", error);
          }
        });

        socket.on("resetGroupUnreadCount", async (data) => {
          const { groupId } = data; // Correctly destructure groupId
          try {
            const user = await User.findById(userId);
            if (user && user.unreadGroupMessagesCount) {
              const updatedUnreadGroupCount = {
                ...user.unreadGroupMessagesCount,
              };
              console.log(
                "Unread group messages before reset:",
                updatedUnreadGroupCount
              );

              delete updatedUnreadGroupCount[groupId]; // Ensure groupId is correctly matched and removed

              console.log("Resetting unread group count for group:", groupId);

              await User.findByIdAndUpdate(userId, {
                unreadGroupMessagesCount: updatedUnreadGroupCount,
              });

              console.log(
                "Updated unread group count:",
                updatedUnreadGroupCount
              );

              socket.emit("unreadGroupMessagesState", updatedUnreadGroupCount);
            }
          } catch (error) {
            console.error("Error resetting group unread count:", error);
          }
        });

        socket.on("memberRemoved", async (data) => {
          const { groupId, memberId, adminId } = data;

          try {
            // Recupera i dettagli del gruppo
            const group = await Group.findById(groupId)
              .populate("members", "userName avatar image isOnline")
              .populate("admin", "userName avatar image isOnline");

            if (!group) return;

            // Aggiornare l'utente rimosso, aggiungendo il gruppo ai suoi removedGroups
            await User.findByIdAndUpdate(memberId, {
              $push: { removedGroups: { groupId } },
            });

            // Notifica all'utente rimosso
            const removedMemberSocketId = userSocketMap.get(memberId);
            if (removedMemberSocketId) {
              // Invia il gruppo con isActive: false
              const inactiveGroup = {
                ...group.toObject(),
                isActive: false,
                userRemoved: true,
              };

              io.to(removedMemberSocketId).emit("removedFromGroup", {
                groupId,
                group: inactiveGroup,
                groupName: group.name,
                removedBy: adminId,
              });
            }

            // Notifiche per gli altri membri...
          } catch (error) {
            console.error("Error in memberRemoved event:", error);
          }
        });

        socket.on("leftGroup", async (data) => {
          const { groupId, userId, wasAdmin, newAdminId } = data;

          try {
            await User.updateOne(
              { _id: userId },
              { $pull: { removedGroups: { groupId } } }
            );

            // Quando un utente esce, aggiungi il gruppo alla sua lista dei gruppi rimossi
            await User.findByIdAndUpdate(userId, {
              $push: { removedGroups: { groupId, left: true } },
            });

            // Recupera informazioni aggiornate sul gruppo
            const group = await Group.findById(groupId)
              .populate("members", "userName avatar image isOnline")
              .populate("admin", "userName avatar image isOnline");

            if (!group) return;

            // Notifica all'utente che è uscito (con un flag che indica l'uscita volontaria)
            const userSocketId = userSocketMap.get(userId);
            if (userSocketId) {
              const inactiveGroup = {
                ...group.toObject(),
                isActive: false,
                userRemoved: false,
                userLeft: true,
              };

              io.to(userSocketId).emit("leftGroup", {
                groupId,
                group: inactiveGroup,
                groupName: group.name,
                wasAdmin,
                newAdminId,
              });
            }

            // Notifica agli altri membri del gruppo
            const memberSocketIds = group.members
              .map((member) => member._id.toString())
              .filter((id) => id !== userId)
              .map((id) => userSocketMap.get(id))
              .filter((id) => id); // Filtra valori null/undefined

            // Aggiungi l'admin se non è già incluso
            if (
              group.admin &&
              group.admin._id.toString() !== userId &&
              !memberSocketIds.includes(
                userSocketMap.get(group.admin._id.toString())
              )
            ) {
              const adminSocketId = userSocketMap.get(
                group.admin._id.toString()
              );
              if (adminSocketId) memberSocketIds.push(adminSocketId);
            }

            // Invia notifica a tutti i membri
            for (const socketId of memberSocketIds) {
              io.to(socketId).emit("userLeftGroup", {
                groupId,
                userId,
                wasAdmin,
                newAdminId,
                groupName: group.name,
              });
            }
          } catch (error) {
            console.error("Error in leftGroup event:", error);
          }
        });

        socket.on("groupDeleted", async (groupId) => {
          // Trova tutti i membri del gruppo
          const group = await Group.findById(groupId).populate("members admin");
          if (group) {
            [...group.members, group.admin].forEach((member) => {
              const memberSocket = userSocketMap.get(member._id.toString());
              if (memberSocket) {
                io.to(memberSocket).emit("groupDeleted", { groupId });
              }
            });
          }
        });

        socket.on("groupAdminChanged", async (data) => {
          const { groupId, newAdminId } = data;

          // Notifica a tutti i membri del gruppo
          const group = await Group.findById(groupId).populate("members admin");
          if (group) {
            [...group.members, group.admin].forEach((member) => {
              const memberSocket = userSocketMap.get(member._id.toString());
              if (memberSocket) {
                io.to(memberSocket).emit("groupUpdated", {
                  groupId,
                  action: "adminChanged",
                  newAdminId,
                });
              }
            });
          }
        });

        socket.on("membersAdded", async (data) => {
          const { groupId, memberIds } = data;

          try {
            for (const memberId of memberIds) {
              await User.updateOne(
                { _id: memberId },
                { $pull: { removedGroups: { groupId } } }
              );
            }

            // Recupera i dettagli completi del gruppo
            const group = await Group.findById(groupId)
              .populate("members", "userName avatar image isOnline")
              .populate("admin", "userName avatar image isOnline");

            if (!group) return;

            console.log(`Sending addedToGroup event to members: ${memberIds}`);

            // Notifica a ciascun nuovo membro che è stato aggiunto al gruppo
            for (const memberId of memberIds) {
              const memberSocketId = userSocketMap.get(memberId);
              if (memberSocketId) {
                // Assicurati che isActive sia true
                const activeGroup = {
                  ...group.toObject(),
                  isActive: true,
                  userRemoved: false,
                };

                io.to(memberSocketId).emit("addedToGroup", {
                  group: activeGroup,
                });
              }
            }
          } catch (error) {
            console.error("Error in membersAdded event:", error);
          }
        });

        socket.on("unreadMessagesState", (serverUnreadMessages) => {
          const rehydratedUnreadMessages = get().rehydratedUnreadMessages || {};

          // Merge rehydrated local state with server state
          const mergedUnreadMessages = get().mergeUnreadCounts(
            rehydratedUnreadMessages,
            serverUnreadMessages
          );

          // Update the store and persist to local storage
          set({ unreadMessagesCount: mergedUnreadMessages });
          localStorage.setItem(
            "chat-storage",
            JSON.stringify({ unreadMessagesCount: mergedUnreadMessages })
          );

          console.log(
            "Final merged unread messages count:",
            mergedUnreadMessages
          );

          // Clear temporary rehydration data
          set({ rehydratedUnreadMessages: null });
        });

        socket.on("unreadGroupMessagesState", (serverUnreadGroupMessages) => {
          const rehydratedUnreadGroupMessages =
            get().rehydratedUnreadGroupMessages || {};

          // Merge rehydrated local state with server state
          const mergedUnreadGroupMessages = get().mergeUnreadCounts(
            rehydratedUnreadGroupMessages,
            serverUnreadGroupMessages
          );

          // Update the store and persist to local storage
          set({ unreadGroupMessagesCount: mergedUnreadGroupMessages });
          localStorage.setItem(
            "chat-storage",
            JSON.stringify({
              unreadGroupMessagesCount: mergedUnreadGroupMessages,
            })
          );

          console.log(
            "Final merged unread group messages count:",
            mergedUnreadGroupMessages
          );

          // Clear temporary rehydration data
          set({ rehydratedUnreadGroupMessages: null });
        });

        socket.on("disconnect", async () => {
          try {
            const user = await User.findById(userId);

            if (user) {
              const unreadMessagesCount = new Map(
                Object.entries(user.unreadMessagesCount || {})
              );

              console.log("Before saving on disconnect:", {
                unreadMessagesCount: Object.fromEntries(unreadMessagesCount),
              });

              await User.updateOne(
                { _id: userId },
                { unreadMessagesCount: Object.fromEntries(unreadMessagesCount) }
              );

              console.log(
                "UnreadMessagesCount saved to database on disconnect:",
                {
                  userId,
                  unreadMessagesCount: Object.fromEntries(unreadMessagesCount),
                }
              );
            }

            await User.findByIdAndUpdate(userId, { isOnline: false });
            disconnect(socket);
          } catch (error) {
            console.error("Error during disconnect:", error);
          }
        });
      } catch (error) {
        console.error("Error during connection setup:", error);
      }
    }
  });
};
export default setupSocket;

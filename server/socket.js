import { Server as SocketIOServer } from "socket.io";
import { Message } from "./models/MessagesModel.js";
import { User } from "./models/UserModel.js";
import { Group } from "./models/GroupModel.js";
import { BlockedUser } from "./models/BlockedUserModel.js";

// Setting up the socket server for handling websocket connections
const setupSocket = (server) => {
  console.log("⚡ Initializing Socket.IO server in Docker environment");
  const io = new SocketIOServer(server, {
    cors: {
      origin: ["http://localhost", "http://client"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Explicitly set path and allow all transports
    path: "/socket.io/",
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Map to track which socket is connected to which user
  const userSocketMap = new Map();

  // Handle disconnections by removing socket from map and updating user status
  const disconnect = (socket) => {
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        io.emit("userStatusUpdate", { userId, isOnline: false });
        break;
      }
    }
  };

  // Send chat message between users with blocking support
  const sendMessage = async (message) => {
    try {
      // Find socket connections
      const senderSocketId = userSocketMap.get(message.sender);
      const recipientSocketId = userSocketMap.get(message.recipient);

      // Check if either user has blocked the other
      const blockExists = await BlockedUser.findOne({
        $or: [
          { blocker: message.sender, blocked: message.recipient },
          { blocker: message.recipient, blocked: message.sender },
        ],
      });

      const isBlocked = !!blockExists;
      let blockedBy = null;

      if (isBlocked) {
        blockedBy = blockExists.blocker.toString();
      }

      // Always save message to database even if blocked
      const createdMessage = await Message.create({
        ...message,
        isBlocked,
        blockedBy: isBlocked ? blockedBy : undefined,
      });

      // Populate sender and recipient info
      const populatedMessage = await Message.findById(createdMessage._id)
        .populate("sender", "id email userName image avatar")
        .populate("recipient", "id email userName image avatar");

      // Always send to the sender, with block info
      if (senderSocketId) {
        const messageForSender = {
          ...populatedMessage.toObject(),
          isBlocked,
          blockedByUser: isBlocked && blockedBy === message.sender,
          blockedByRecipient: isBlocked && blockedBy === message.recipient,
          isCurrentUserSender: true, // This user sent this message
        };

        io.to(senderSocketId).emit("receiveMessage", messageForSender);
      }

      // Only send to recipient if not blocked
      if (!isBlocked && recipientSocketId) {
        const messageForRecipient = {
          ...populatedMessage.toObject(),
          isCurrentUserSender: false, // This user received this message
        };

        io.to(recipientSocketId).emit("receiveMessage", messageForRecipient);

        // Increment unread count for offline or different-tab recipients
        const recipient = await User.findById(message.recipient);
        if (recipient) {
          // Create a copy of the unread messages count
          const unreadMessagesCount =
            { ...recipient.unreadMessagesCount } || {};

          // Increment count for the sender
          unreadMessagesCount[message.sender] =
            (unreadMessagesCount[message.sender] || 0) + 1;

          // Update user document with new count
          await User.findByIdAndUpdate(
            message.recipient,
            { unreadMessagesCount },
            { new: true }
          );

          console.log(
            `Incremented unread count for ${message.sender} to recipient ${message.recipient}`
          );
        }
      }
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  // Handle group messaging with membership validation
  const sendGroupMessage = async (message) => {
    try {
      const { groupId, sender, content, messageType, fileURL } = message;

      // Validate group exists
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

      // Verify if user is member or admin
      const isMember =
        group.members.some(
          (member) => member.toString() === sender.toString()
        ) || group.admin.toString() === sender.toString();

      // Check if user was removed from group
      const user = await User.findById(sender);
      const isRemovedFromGroup =
        user.removedGroups &&
        user.removedGroups.some(
          (item) =>
            item.groupId && item.groupId.toString() === groupId.toString()
        );

      // Reject message if user not in group or was removed
      if (!isMember || isRemovedFromGroup) {
        console.log(
          `Blocked message from ${sender} to group ${groupId}: User not in group or removed`
        );
        const senderSocketId = userSocketMap.get(sender);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageRejected", {
            groupId,
            reason: "User not in group or removed",
          });
        }
        return;
      }

      // Create message in database
      const createdMessage = await Message.create({
        sender,
        recipient: null, // Group messages have no recipient
        content,
        messageType,
        timestamp: Date.now(),
        fileURL,
      });

      // Populate sender info
      const messageData = await Message.findById(createdMessage._id)
        .populate("sender", "id email userName image avatar")
        .exec();

      // Add message to group's messages array
      const updatedGroup = await Group.findByIdAndUpdate(
        groupId,
        { $push: { messages: messageData._id } },
        { new: true }
      ).populate("members admin");

      const finalData = { ...messageData._doc, groupId: updatedGroup._id };

      // Track online vs offline members
      const onlineMembers = new Set();
      const offlineMembers = [];

      // Create set of member IDs for lookup
      const memberIds = new Set(
        updatedGroup.members.map((m) => m._id.toString())
      );

      // Send message to all online members
      updatedGroup.members.forEach((member) => {
        const memberSocketId = userSocketMap.get(member._id.toString());
        if (memberSocketId) {
          onlineMembers.add(member._id.toString());
          io.to(memberSocketId).emit("receiveGroupMessage", finalData);
        } else {
          // Member is offline, add to list
          offlineMembers.push(member._id.toString());
        }
      });

      // Include admin if not already in members list
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

      // Increment unread count for offline members (not the sender)
      let allMemberIds = updatedGroup.members.map((m) => m._id.toString());
      if (!allMemberIds.includes(adminId)) {
        allMemberIds.push(adminId);
      }

      // Update the unread group count in the DB for all group members except the sender
      for (const memberId of allMemberIds) {
        if (memberId === sender.toString()) continue; // skip the sender
        const user = await User.findById(memberId);
        if (user) {
          // Create or clone the current unread group messages count
          const currentGroupCounts = {
            ...(user.unreadGroupMessagesCount || {}),
          };
          // Increment the count for this group
          currentGroupCounts[groupId] = (currentGroupCounts[groupId] || 0) + 1;

          // Update the user document with the new count
          await User.findByIdAndUpdate(
            memberId,
            { unreadGroupMessagesCount: currentGroupCounts },
            { new: true }
          );
          console.log(
            `Incremented persistent unread group count for group ${groupId} for member ${memberId}`
          );
        }
      }
    } catch (error) {
      console.error("Error in sendGroupMessage:", error);
    }
  };

  // Socket connection handler
  io.on("connection", async (socket) => {
    // Get the userId from the query parameter
    const userId = socket.handshake.query.userId;

    if (userId) {
      try {
        // Track the user's socket and set online status
        userSocketMap.set(userId, socket.id);
        await User.findByIdAndUpdate(userId, { isOnline: true });
        io.emit("userStatusUpdate", { userId, isOnline: true });

        // Send initial unread counts to client
        const user = await User.findById(userId);
        if (user) {
          socket.emit(
            "fullUnreadMessagesState",
            user.unreadMessagesCount || {}
          );
          socket.emit(
            "fullUnreadGroupMessagesState",
            user.unreadGroupMessagesCount || {}
          );
        }

        // Single unread count reset for direct messages
        socket.on("resetSingleUnreadCount", async (data) => {
          try {
            const { senderId } = data;
            if (!senderId) {
              console.warn("Invalid senderId in resetSingleUnreadCount");
              socket.emit("resetSingleUnreadCountAck", {
                senderId,
                success: false,
              });
              return;
            }

            console.log(
              `User ${userId} is resetting unread count for sender ${senderId}`
            );

            const user = await User.findById(userId);
            if (!user || !user.unreadMessagesCount) {
              socket.emit("resetSingleUnreadCountAck", {
                senderId,
                success: false,
              });
              return;
            }

            // Create a copy of user's unread counts
            const updatedUnreadCount = { ...user.unreadMessagesCount };

            // Only remove this specific sender's count
            if (updatedUnreadCount[senderId] !== undefined) {
              delete updatedUnreadCount[senderId];

              // Update database with modified unread counts
              await User.findByIdAndUpdate(userId, {
                unreadMessagesCount: updatedUnreadCount,
              });

              // Send acknowledgment to just this client
              socket.emit("resetSingleUnreadCountAck", {
                senderId,
                success: true,
              });

              console.log(
                `Reset unread count for ${senderId} in user ${userId}'s document`
              );
            } else {
              // Nothing to remove
              socket.emit("resetSingleUnreadCountAck", {
                senderId,
                success: true,
                message: "No unread count existed",
              });
            }
          } catch (error) {
            console.error("Error in resetSingleUnreadCount:", error);
            socket.emit("resetSingleUnreadCountAck", {
              senderId: data.senderId,
              success: false,
              error: "Server error",
            });
          }
        });

        // Single unread count reset for group messages
        socket.on("resetSingleGroupUnreadCount", async (data) => {
          try {
            const { groupId } = data;
            if (!groupId) {
              console.warn("Invalid groupId in resetSingleGroupUnreadCount");
              socket.emit("resetSingleGroupUnreadCountAck", {
                groupId,
                success: false,
              });
              return;
            }

            console.log(
              `User ${userId} is resetting unread count for group ${groupId}`
            );

            const user = await User.findById(userId);
            if (!user || !user.unreadGroupMessagesCount) {
              socket.emit("resetSingleGroupUnreadCountAck", {
                groupId,
                success: false,
              });
              return;
            }

            // Create a copy of user's unread group counts
            const updatedUnreadCount = { ...user.unreadGroupMessagesCount };

            // Only remove this specific group's count
            if (updatedUnreadCount[groupId] !== undefined) {
              delete updatedUnreadCount[groupId];

              // Update database with modified unread counts
              await User.findByIdAndUpdate(userId, {
                unreadGroupMessagesCount: updatedUnreadCount,
              });

              // Send acknowledgment to just this client
              socket.emit("resetSingleGroupUnreadCountAck", {
                groupId,
                success: true,
              });

              console.log(
                `Reset unread count for group ${groupId} in user ${userId}'s document`
              );
            } else {
              // Nothing to remove
              socket.emit("resetSingleGroupUnreadCountAck", {
                groupId,
                success: true,
                message: "No unread count existed",
              });
            }
          } catch (error) {
            console.error("Error in resetSingleGroupUnreadCount:", error);
            socket.emit("resetSingleGroupUnreadCountAck", {
              groupId: data.groupId,
              success: false,
              error: "Server error",
            });
          }
        });

        // Fetch unread counts handler
        socket.on("fetchUnreadCounts", async (requestedUserId) => {
          try {
            console.log(`Fetching unread counts for user: ${requestedUserId}`);
            const user = await User.findById(requestedUserId);

            if (user) {
              // Get current unread counts from user document
              const unreadMessagesCount = user.unreadMessagesCount || {};
              const unreadGroupMessagesCount =
                user.unreadGroupMessagesCount || {};

              console.log("Sending full unread states to client:", {
                userInfo: `${requestedUserId}`,
                directMessages: Object.keys(unreadMessagesCount).length,
                groupMessages: Object.keys(unreadGroupMessagesCount).length,
              });

              // Use consistent event names for full state updates
              socket.emit("fullUnreadMessagesState", unreadMessagesCount);
              socket.emit(
                "fullUnreadGroupMessagesState",
                unreadGroupMessagesCount
              );
            }
          } catch (error) {
            console.error("Error fetching unread counts:", error);
          }
        });

        // Enhanced sync unread counts handler
        socket.on("syncUnreadCounts", async (data) => {
          try {
            console.log(`User ${userId} requesting to sync unread counts`);

            const user = await User.findById(userId);
            if (!user) return;

            // Get current server counts
            const serverPrivateCounts = user.unreadMessagesCount || {};
            const serverGroupCounts = user.unreadGroupMessagesCount || {};

            // Get client counts from data
            const clientPrivateCounts = data.unreadMessagesCount || {};
            const clientGroupCounts = data.unreadGroupMessagesCount || {};

            // Create merged counts by taking MAX of each count
            const mergedPrivateCounts = {};
            const mergedGroupCounts = {};

            // Process all keys from both server and client
            const allPrivateKeys = new Set([
              ...Object.keys(serverPrivateCounts),
              ...Object.keys(clientPrivateCounts),
            ]);

            const allGroupKeys = new Set([
              ...Object.keys(serverGroupCounts),
              ...Object.keys(clientGroupCounts),
            ]);

            // Take the maximum count for each key
            allPrivateKeys.forEach((key) => {
              const serverValue = parseInt(serverPrivateCounts[key] || 0);
              const clientValue = parseInt(clientPrivateCounts[key] || 0);
              mergedPrivateCounts[key] = Math.max(serverValue, clientValue);
            });

            allGroupKeys.forEach((key) => {
              const serverValue = parseInt(serverGroupCounts[key] || 0);
              const clientValue = parseInt(clientGroupCounts[key] || 0);
              mergedGroupCounts[key] = Math.max(serverValue, clientValue);
            });

            // Save the merged counts to the database
            await User.findByIdAndUpdate(userId, {
              unreadMessagesCount: mergedPrivateCounts,
              unreadGroupMessagesCount: mergedGroupCounts,
            });

            console.log("Synced and merged unread counts:", {
              userId,
              direct: Object.keys(mergedPrivateCounts).length,
              groups: Object.keys(mergedGroupCounts).length,
            });

            // Send the merged counts back to the client with consistent event names
            socket.emit("fullUnreadMessagesState", mergedPrivateCounts);
            socket.emit("fullUnreadGroupMessagesState", mergedGroupCounts);
          } catch (error) {
            console.error("Error syncing unread counts:", error);
          }
        });

        // Message handlers
        socket.on("sendMessage", sendMessage);
        socket.on("sendGroupMessage", sendGroupMessage);

        // Handle newGroup event
        socket.on("newGroup", async (group) => {
          // Get group with populated members and admin
          const populatedGroup = await Group.findById(group._id)
            .populate("members", "id email userName image avatar")
            .populate("admin", "id email userName image avatar");

          // Notify all members about new group
          populatedGroup.members.forEach((member) => {
            const memberSocketId = userSocketMap.get(member._id.toString());
            if (memberSocketId) {
              io.to(memberSocketId).emit("groupCreated", populatedGroup);
            }
          });
        });

        // Handle group member removed
        socket.on("memberRemoved", async (data) => {
          const { groupId, memberId, adminId } = data;

          try {
            // Get group details
            const group = await Group.findById(groupId)
              .populate("members", "userName avatar image isOnline")
              .populate("admin", "userName avatar image isOnline");

            if (!group) return;

            // Update removed user's document
            await User.findByIdAndUpdate(memberId, {
              $push: { removedGroups: { groupId } },
            });

            // Notify the removed member
            const removedMemberSocketId = userSocketMap.get(memberId);
            if (removedMemberSocketId) {
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
          } catch (error) {
            console.error("Error in memberRemoved event:", error);
          }
        });

        // Handle user leaving group
        socket.on("leftGroup", async (data) => {
          const { groupId, userId, wasAdmin, newAdminId } = data;

          try {
            // Remove any previous entry for this group
            await User.updateOne(
              { _id: userId },
              { $pull: { removedGroups: { groupId } } }
            );

            // Add new entry with left flag set to true
            await User.findByIdAndUpdate(userId, {
              $push: { removedGroups: { groupId, left: true } },
            });

            // Get group details
            const group = await Group.findById(groupId)
              .populate("members", "userName avatar image isOnline")
              .populate("admin", "userName avatar image isOnline");

            if (!group) return;

            // Notify the user who left
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

            // Notify other members
            const memberSocketIds = group.members
              .map((member) => member._id.toString())
              .filter((id) => id !== userId)
              .map((id) => userSocketMap.get(id))
              .filter((id) => id);

            // Include admin if not already in the list
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

            // Send notification to all other members
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

        // Handle group deletion
        socket.on("groupDeleted", async (data) => {
          const { groupId, isRemoved } = data;

          try {
            // Get group with members and admin
            const group = await Group.findById(groupId).populate(
              "members admin"
            );

            if (group) {
              // Notify all members and admin
              [...group.members, group.admin].forEach((member) => {
                const memberSocket = userSocketMap.get(member._id.toString());
                if (memberSocket) {
                  io.to(memberSocket).emit("groupDeleted", {
                    groupId,
                    isRemoved,
                    isDeleted: true,
                    deletedAt: group.deletedAt,
                  });
                }
              });
            }
          } catch (error) {
            console.error("Error processing group deletion:", error);
          }
        });

        // Handle admin change
        socket.on("groupAdminChanged", async (data) => {
          const { groupId, newAdminId } = data;

          // Notify all members
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

        // Handle adding members to group
        socket.on("membersAdded", async (data) => {
          const { groupId, memberIds } = data;

          try {
            // Clear removedGroups entries for new members
            for (const memberId of memberIds) {
              await User.updateOne(
                { _id: memberId },
                { $pull: { removedGroups: { groupId } } }
              );
            }

            // Get updated group details
            const group = await Group.findById(groupId)
              .populate("members", "userName avatar image isOnline")
              .populate("admin", "userName avatar image isOnline");

            if (!group) return;

            console.log(`Sending addedToGroup event to members: ${memberIds}`);

            // Notify all new members
            for (const memberId of memberIds) {
              const memberSocketId = userSocketMap.get(memberId);
              if (memberSocketId) {
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

        // Handle user block events
        socket.on("userBlocked", async (data) => {
          const { blockedUserId } = data;
          try {
            // Notify the blocked user if they're online
            const blockedUserSocketId = userSocketMap.get(blockedUserId);
            if (blockedUserSocketId) {
              io.to(blockedUserSocketId).emit("blockedByUser", {
                blockerId: userId,
              });
            }

            // Also confirm back to the blocker that the action was successful
            // This ensures the UI updates immediately for both parties
            io.to(socket.id).emit("blockActionComplete", {
              targetUserId: blockedUserId,
              action: "block",
              success: true,
            });
          } catch (error) {
            console.error("Error handling user blocked event:", error);
            // Send error to client if needed
            io.to(socket.id).emit("blockActionComplete", {
              targetUserId: blockedUserId,
              action: "block",
              success: false,
              error: error.message,
            });
          }
        });

        socket.on("userUnblocked", async (data) => {
          const { blockedUserId } = data;
          try {
            // Notify the unblocked user if they're online
            const unblockedUserSocketId = userSocketMap.get(blockedUserId);
            if (unblockedUserSocketId) {
              io.to(unblockedUserSocketId).emit("unblockedByUser", {
                unblockerId: userId,
              });
            }

            // Also confirm back to the unblocking user that the action was successful
            // This ensures the UI updates immediately for both parties
            io.to(socket.id).emit("blockActionComplete", {
              targetUserId: blockedUserId,
              action: "unblock",
              success: true,
            });
          } catch (error) {
            console.error("Error handling user unblocked event:", error);
            // Send error to client if needed
            io.to(socket.id).emit("blockActionComplete", {
              targetUserId: blockedUserId,
              action: "unblock",
              success: false,
              error: error.message,
            });
          }
        });

        // Handle disconnection
        socket.on("disconnect", async () => {
          try {
            const user = await User.findById(userId);

            if (user) {
              // Update online status
              await User.findByIdAndUpdate(userId, { isOnline: false });
              disconnect(socket);
            }
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

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

  const unreadMessagesMap = new Map();

  // Handles the disconnection of a socket
  const disconnect = (socket) => {
    console.log(`Client disconnected: ${socket.id}`);
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
    // Get the socketId of the sender and recipient
    const senderSocketId = userSocketMap.get(message.sender);
    const recipientSocketId = userSocketMap.get(message.recipient);

    // Save the message to the database
    const createdMessage = await Message.create(message);

    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email username image avatar")
      .populate("recipient", "id email username image avatar");

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveMessage", messageData);
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("receiveMessage", messageData);
    }

    // If the recipient is online, send the message to the recipient
    // Otherwise, save the message as an unread message
    if (!userSocketMap.has(message.recipient.toString())) {
      const recipientUnreadMessages =
        unreadMessagesMap.get(message.recipient.toString()) || {};
      recipientUnreadMessages[message.sender.toString()] =
        (recipientUnreadMessages[message.sender.toString()] || 0) + 1;
      unreadMessagesMap.set(
        message.recipient.toString(),
        recipientUnreadMessages
      );
    }
  };

  const sendGroupMessage = async (message) => {
    const { groupId, sender, content, messageType, fileURL } = message;

    const createdMessage = await Message.create({
      sender,
      recipient: null,
      content,
      messageType,
      timestamp: new Date(),
      fileURL,
    });

    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email userName image avatar")
      .exec();

    await Group.findByIdAndUpdate(groupId, {
      $push: { messages: messageData._id },
    });

    const group = await Group.findById(groupId).populate("members");

    const finalData = { ...messageData._doc, groupId: group._id };

    if (group && group.members) {
      group.members.forEach((member) => {
        const memberSocketId = userSocketMap.get(member._id.toString());
        if (memberSocketId) {
          io.to(memberSocketId).emit("receiveGroupMessage", finalData);
        } else {
          const recipientUnreadMessages =
            unreadMessagesMap.get(member._id.toString()) || {};
          recipientUnreadMessages[sender.toString()] =
            (recipientUnreadMessages[sender.toString()] || 0) + 1;
          unreadMessagesMap.set(member._id.toString(), recipientUnreadMessages);
        }
      });
      const adminSocketId = userSocketMap.get(group.admin._id.toString());
      if (adminSocketId) {
        io.to(adminSocketId).emit("receiveGroupMessage", finalData);
      }
    }
  };

  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      userSocketMap.set(userId, socket.id);

      await User.findByIdAndUpdate(userId, { isOnline: true });
      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
      io.emit("userStatusUpdate", { userId, isOnline: true });

      socket.on("getUnreadMessages", () => {
        const unreadMessages = unreadMessagesMap.get(userId) || {};
        socket.emit("unreadMessagesState", unreadMessages);
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
      socket.on("disconnect", async () => {
        await User.findByIdAndUpdate(userId, { isOnline: false });
        disconnect(socket);
      });
    }
  });
};
export default setupSocket;

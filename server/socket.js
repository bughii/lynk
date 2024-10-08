import { Server as SocketIOServer } from "socket.io";
import { Message } from "./models/MessagesModel.js";
import { User } from "./models/UserModel.js";

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

  // Esempio di come potrebbe apparire notifyNewGroup
  const notifyNewGroup = (newGroup) => {
    console.log("notifyNewGroup function called");
    console.log("New group details:", JSON.stringify(newGroup, null, 2));

    const groupMembers = newGroup.members.concat(newGroup.admin);
    console.log("Group members to notify:", groupMembers);

    groupMembers.forEach((memberId) => {
      console.log("Attempting to emit to member:", memberId.toString());
      const socketId = userSocketMap.get(memberId.toString());
      if (socketId) {
        console.log(
          "Socket found for member:",
          memberId.toString(),
          "SocketId:",
          socketId
        );
        io.to(socketId).emit("newGroup", newGroup);
        console.log("Emitted newGroup event to socket:", socketId);
      } else {
        console.log("No socket found for member:", memberId.toString());
      }
    });
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
    } else {
      console.log("User ID not provided during connection");
    }

    socket.on("sendMessage", sendMessage);
    socket.on("disconnect", async () => {
      await User.findByIdAndUpdate(userId, { isOnline: false });
      disconnect(socket);
    });
  });
};

export default setupSocket;

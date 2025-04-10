import { Message } from "../models/MessagesModel.js";
import { mkdirSync, renameSync } from "fs";
import { BlockedUser } from "../models/BlockedUserModel.js";

// Retrieve messages between two users
export const getMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const otherUserId = req.body.id;

    if (!userId || !otherUserId) {
      return res.status(400).json({ message: "Both user IDs required" });
    }

    // Get all messages between the two users
    const allMessages = await Message.find({
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId },
      ],
    })
      .sort({ timestamp: 1 })
      .populate("sender", "id email userName image avatar")
      .populate("recipient", "id email userName image avatar");

    // Check if there's a block between these users
    const blockExists = await BlockedUser.findOne({
      $or: [
        { blocker: userId, blocked: otherUserId },
        { blocker: otherUserId, blocked: userId },
      ],
    });

    // Filter visible messages based on block status
    let visibleMessages = allMessages;

    if (blockExists) {
      const blockCreationTime = blockExists.createdAt;

      // Filter out messages that shouldn't be shown
      visibleMessages = allMessages.filter((message) => {
        // If message was sent before block was created, show it to everyone
        if (message.timestamp < blockCreationTime) {
          return true;
        }

        // If current user sent the message, they can see it (with a block indicator)
        if (message.sender._id.toString() === userId) {
          message.isBlocked = true;
          message.blockedByUser = blockExists.blocker.toString() === userId;
          message.blockedByRecipient =
            blockExists.blocker.toString() === otherUserId;
          return true;
        }

        // Otherwise, message should not be visible
        return false;
      });
    }

    return res.status(200).json({ messages: visibleMessages });
  } catch (error) {
    console.error("Error getting messages:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const uploadFile = async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Get the current date
    const date = Date.now();

    // Directory where the file will be saved
    let fileDir = `uploads/files/${date}`;

    // Complete file path
    let fileName = `${fileDir}/${req.file.originalname}`;

    // Create the actual directory
    mkdirSync(fileDir, { recursive: true });

    // Move the file to the directory
    renameSync(req.file.path, fileName);

    return res
      .status(200)
      .json({ message: "File uploaded", filePath: fileName });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateMessageAppearance = async (req, res) => {
  try {
    const { sentMessageColor, receivedMessageColor, fontSize } = req.body;
    const { userId } = req;

    // Update all the messaged where the current user is the sender
    await Message.updateMany(
      { sender: userId },
      {
        $set: {
          // Set the new values for the appearance
          "appearance.sentMessageColor": sentMessageColor,
          "appearance.fontSize": fontSize,
        },
      }
    );

    // Update all the messages where the current user is the recipient
    await Message.updateMany(
      { recipient: userId },
      {
        $set: {
          "appearance.receivedMessageColor": receivedMessageColor,
          "appearance.fontSize": fontSize,
        },
      }
    );

    res.status(200).json({
      success: true,
      settings: {
        sentMessageColor,
        receivedMessageColor,
        fontSize,
      },
    });
  } catch (error) {
    console.log("Error updating message appearance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

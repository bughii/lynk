import { Message } from "../models/MessagesModel.js";
import { mkdirSync, renameSync } from "fs";

// Retrieve messages between two users
export const getMessages = async (req, res) => {
  try {
    const user1 = req.userId; // The logged in user
    const user2 = req.body.id; // The user to chat with

    if (!user1 || !user2) {
      return res.status(400).json({ message: "Both user ID required" });
    }

    // Search the Message collection
    const messages = await Message.find({
      $or: [
        //Sender is user1 and recipient is user2 or vice versa
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
    }).sort({ timestamp: 1 }); // Make them in chronological order

    return res.status(200).json({ messages }); // Return the messages
  } catch (error) {
    console.log({ error });
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

import mongoose from "mongoose";

// Message schema
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: false,
  },
  messageType: {
    type: String,
    enum: ["text", "file"],
    required: true,
  },
  content: {
    type: String,
    required: function () {
      return this.messageType === "text";
    },
  },
  fileURL: {
    type: String,
    required: function () {
      return this.messageType === "file";
    },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  appearance: {
    sentMessageColor: {
      type: String,
      default: "#3B82F6",
    },
    receivedMessageColor: {
      type: String,
      default: "#8B5CF6",
    },
    fontSize: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "medium",
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: false,
  },
});

export const Message = mongoose.model("Messages", messageSchema);

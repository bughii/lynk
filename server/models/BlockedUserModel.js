import mongoose from "mongoose";

const blockedUserSchema = new mongoose.Schema(
  {
    blocker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    blocked: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index
blockedUserSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export const BlockedUser = mongoose.model("BlockedUsers", blockedUserSchema);

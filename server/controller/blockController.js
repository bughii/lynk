import { BlockedUser } from "../models/BlockedUserModel.js";

// Block a user
export const blockUser = async (req, res) => {
  try {
    const { userId } = req;
    const { blockedUserId } = req.body;

    // Check if already blocked
    const existingBlock = await BlockedUser.findOne({
      blocker: userId,
      blocked: blockedUserId,
    });

    if (existingBlock) {
      return res.status(400).json({ message: "User already blocked" });
    }

    // Create new block
    const newBlock = new BlockedUser({
      blocker: userId,
      blocked: blockedUserId,
    });

    await newBlock.save();

    return res.status(201).json({
      success: true,
      message: "User blocked successfully",
    });
  } catch (error) {
    console.error("Error blocking user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Unblock a user
export const unblockUser = async (req, res) => {
  try {
    const { userId } = req;
    const { blockedUserId } = req.body;

    const result = await BlockedUser.findOneAndDelete({
      blocker: userId,
      blocked: blockedUserId,
    });

    if (!result) {
      return res.status(404).json({ message: "Block not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully",
    });
  } catch (error) {
    console.error("Error unblocking user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Check if a user is blocked
export const checkBlockStatus = async (req, res) => {
  try {
    const { userId } = req;
    const { targetUserId } = req.params;

    // Check if the current user has blocked the target
    const userHasBlocked = await BlockedUser.findOne({
      blocker: userId,
      blocked: targetUserId,
    });

    // Check if the target has blocked the current user
    const userIsBlocked = await BlockedUser.findOne({
      blocker: targetUserId,
      blocked: userId,
    });

    return res.status(200).json({
      userHasBlocked: !!userHasBlocked,
      userIsBlocked: !!userIsBlocked,
    });
  } catch (error) {
    console.error("Error checking block status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get list of blocked users
export const getBlockedUsers = async (req, res) => {
  try {
    const { userId } = req;

    const blockedUsers = await BlockedUser.find({ blocker: userId })
      .populate("blocked", "userName avatar image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      blockedUsers: blockedUsers.map((block) => block.blocked),
    });
  } catch (error) {
    console.error("Error getting blocked users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

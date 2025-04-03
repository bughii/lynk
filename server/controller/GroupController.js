import { User } from "../models/UserModel.js";
import { Group } from "../models/GroupModel.js";
import { Message } from "../models/MessagesModel.js";
import mongoose from "mongoose";

export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    const userId = req.userId;

    const admin = await User.findById(userId);

    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    // Check if all user IDs in the members array actually exist in the db
    // Find all users whose ID is in the members array
    const validateMembers = await User.find({ _id: { $in: members } });
    // If all IDs in the members array exist in the db, the length of the array will be the same
    if (validateMembers.length !== members.length) {
      return res.status(404).json({ message: "One or more members not found" });
    }

    const newGroup = new Group({
      name,
      members,
      admin: userId,
    });

    await newGroup.save();
    return res.status(201).json({ group: newGroup });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    // Convert the userId in a object ObjectId
    // This is necessary to query the database
    const userId = new mongoose.Types.ObjectId(req.userId);

    // Search in the database the groups where the user is the admin or a member
    const activeGroups = await Group.find({
      $or: [{ admin: userId }, { members: userId }],
    })
      .sort({ updatedAt: -1 })
      .populate("members", "id email username image avatar userName")
      .populate("admin", "id email username image avatar userName");

    // Retrieve the user's document from the database
    const user = await User.findById(userId);

    // If the user has no removedGroups, return the active groups
    if (!user.removedGroups || user.removedGroups.length === 0) {
      const groupsWithActiveFlag = activeGroups.map((group) => ({
        ...group.toObject(),
        isActive: true,
        userRemoved: false,
        userLeft: false,
      }));

      return res.status(200).json({ groups: groupsWithActiveFlag });
    }

    // Extracting the IDs of the removed groups in the user's document
    const removedGroupIds = user.removedGroups.map((item) =>
      item.groupId.toString()
    );

    // Creating a map with the group ID as key and the left flag as value
    const removedGroupsInfo = {};
    user.removedGroups.forEach((item) => {
      if (item.groupId) {
        removedGroupsInfo[item.groupId.toString()] = {
          left: !!item.left,
        };
      }
    });

    // Creating an array with the IDs of the active groups
    const activeGroupIds = activeGroups.map((group) => group._id.toString());
    // Filtering removedGroupIds by excluding the IDs that are in the activeGroupIds array
    // This ensures that if a user has been removed and then added back to a group, the group will be considered active
    const filteredRemovedGroupIds = removedGroupIds.filter(
      (id) => !activeGroupIds.includes(id)
    );

    // If there are no removed groups after filtering, return the active groups
    if (filteredRemovedGroupIds.length === 0) {
      const groupsWithActiveFlag = activeGroups.map((group) => ({
        ...group.toObject(),
        isActive: true,
        userRemoved: false,
        userLeft: false,
      }));

      return res.status(200).json({ groups: groupsWithActiveFlag });
    }

    // Otherwise, find the details of the removed groups
    const removedGroups = await Group.find({
      _id: { $in: filteredRemovedGroupIds },
    })
      .populate("members", "id email username image avatar userName")
      .populate("admin", "id email username image avatar userName");

    // Add the correct flags to each active group
    const formattedActiveGroups = activeGroups.map((group) => ({
      ...group.toObject(),
      isActive: true,
      userRemoved: false,
      userLeft: false,
    }));

    // Add the correct flags to each removed group
    const formattedRemovedGroups = removedGroups.map((group) => {
      const groupInfo = removedGroupsInfo[group._id.toString()] || {};
      return {
        ...group.toObject(),
        isActive: false,
        userRemoved: !groupInfo.left, // If left is false, user was removed
        userLeft: !!groupInfo.left,
      };
    });

    // Combine the active and removed groups and return the result to the client
    const allGroups = [...formattedActiveGroups, ...formattedRemovedGroups];

    return res.status(200).json({ groups: allGroups });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate({
      path: "messages",
      populate: { path: "sender", select: "id email userName image avatar" },
    });

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const messages = group.messages;
    return res.status(200).json({ messages });
  } catch (error) {}
};

export const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.body;
    const userId = req.userId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Verify that the current user is the admin of the group
    if (group.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    // Verify that the admin is not trying to remove himself
    if (memberId === userId) {
      return res.status(400).json({
        message: "Admin cannot remove themselves using this endpoint",
      });
    }

    // Remove the member from the group
    // pull removed memberUd from the members array
    await Group.findByIdAndUpdate(groupId, {
      $pull: { members: memberId },
    });

    // Mark the group as removed in the user's document
    await User.findByIdAndUpdate(memberId, {
      $push: { removedGroups: { groupId } },
    });

    // Return the updated group details
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "userName avatar image")
      .populate("admin", "userName avatar image");

    return res.status(200).json({
      message: "Member removed successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.userId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // If the user is the admin, they cannot leave the group
    // They must assign a new admin before leaving
    if (group.admin.toString() === userId) {
      return res
        .status(400)
        .json({ message: "Admin must assign new admin before leaving" });
    }

    // Remove the user from the group
    await Group.findByIdAndUpdate(groupId, {
      $pull: { members: userId },
    });

    // Add the group to the user's removedGroups list
    // with the left flag set to true, he left voluntarily
    await User.findByIdAndUpdate(userId, {
      $push: { removedGroups: { groupId, left: true } },
    });

    return res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const changeAdmin = async (req, res) => {
  try {
    const { groupId, newAdminId } = req.body;
    const userId = req.userId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Verify that the current user is the admin of the group
    if (group.admin.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Only current admin can change admin" });
    }

    // Verify that the new admin is a member of the group
    if (!group.members.includes(newAdminId)) {
      return res
        .status(400)
        .json({ message: "New admin must be a member of the group" });
    }

    // Update the admin with the new ID newAdminId and save
    group.admin = newAdminId;
    await group.save();

    return res.status(200).json({ message: "Admin changed successfully" });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    // Verify the group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Verify current user is the admin
    if (group.admin.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Only admin can delete the group" });
    }

    // Mark as deleted instead of removing it permanently
    group.isDeleted = true;
    group.deletedAt = new Date();
    group.deletedBy = userId;

    // Create a valid system message about the deletion
    const systemMessage = new Message({
      sender: userId, // Admin as sender
      messageType: "text", // "text" type
      content: "This group has been deleted by the admin.",
      timestamp: new Date(),
      isSystem: true, // This is a system message
    });

    await systemMessage.save();

    // Add the system message to the group's messages
    group.messages.push(systemMessage._id);
    await group.save();

    return res.status(200).json({
      message: "Group deleted successfully",
      group: {
        _id: group._id,
        isDeleted: true,
        deletedAt: group.deletedAt,
      },
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    // Find the group and load the members and admin details
    const group = await Group.findById(groupId)
      .populate("members", "userName email avatar image isOnline")
      .populate("admin", "userName email avatar image isOnline");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the user is a member or admin of the group
    const isMember = group.members.some(
      (member) => member._id.toString() === userId
    );
    const isAdmin = group.admin._id.toString() === userId;

    // Checks if the user has been removed or left the group
    const user = await User.findById(userId);
    const removedGroupEntry =
      user.removedGroups &&
      user.removedGroups.find(
        (item) => item.groupId && item.groupId.toString() === groupId
      );

    // Add the correct flags to the group object
    const groupWithFlags = {
      ...group.toObject(),
      isActive: isMember || isAdmin,
      userRemoved: !!(removedGroupEntry && !removedGroupEntry.left),
      userLeft: !!(removedGroupEntry && removedGroupEntry.left),
    };

    return res.status(200).json({ group: groupWithFlags });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addMembers = async (req, res) => {
  try {
    const { groupId, memberIds } = req.body;
    const userId = req.userId;

    // Check if groupId and memberIds are valid
    if (
      !groupId ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Check if the group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the current user is the admin of the group
    if (group.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    // Check if the users that are being added exist
    const users = await User.find({ _id: { $in: memberIds } });
    if (users.length !== memberIds.length) {
      return res.status(400).json({ message: "One or more users not found" });
    }

    // Filter out the users that are already members of the group
    const currentMemberIds = group.members.map((member) => member.toString());
    const newMemberIds = memberIds.filter(
      (id) => !currentMemberIds.includes(id)
    );

    if (newMemberIds.length === 0) {
      return res.status(400).json({ message: "All users are already members" });
    }

    // For every member, remove the group from the removedGroups list
    for (const memberId of newMemberIds) {
      await User.updateOne(
        { _id: memberId },
        { $pull: { removedGroups: { groupId } } }
      );
    }

    // Add the new members to the group AND SAVE
    group.members.push(...newMemberIds);
    await group.save();

    // Return the updated group details
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "userName email avatar image")
      .populate("admin", "userName email avatar image");

    return res.status(200).json({
      message: "Members added successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Error adding members:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroupMedia = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    // Check if the group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the user is a member or admin of the group
    const isMember = group.members.some(
      (member) => member.toString() === userId
    );
    const isAdmin = group.admin.toString() === userId;

    // If he's not, return an error
    if (!isMember && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this group's media" });
    }

    // Retrieve all file messages in the group
    const fileMessages = await Message.find({
      _id: { $in: group.messages },
      messageType: "file",
    })
      .populate("sender", "userName avatar image")
      .sort({ timestamp: -1 });

    // Format the file messages to only include necessary details
    const files = fileMessages.map((message) => ({
      _id: message._id,
      fileURL: message.fileURL,
      fileName: message.fileURL.split("/").pop(),
      fileType: getFileType(message.fileURL),
      sender: message.sender,
      timestamp: message.timestamp,
    }));

    return res.status(200).json({ files });
  } catch (error) {
    console.error("Error fetching group media:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Helper function to determin the file type
function getFileType(fileURL) {
  const extension = fileURL.split(".").pop().toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
    return "image/" + extension;
  } else if (["mp4", "webm", "ogg", "mov"].includes(extension)) {
    return "video/" + extension;
  } else if (["mp3", "wav", "ogg", "aac"].includes(extension)) {
    return "audio/" + extension;
  } else if (extension === "pdf") {
    return "application/pdf";
  } else if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return "application/archive";
  } else {
    // Unknown file type
    return "application/octet-stream";
  }
}

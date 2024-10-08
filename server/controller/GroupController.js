import { User } from "../models/UserModel.js";
import { Group } from "../models/GroupModel.js";
import mongoose from "mongoose";
import notifyNewGroup from "../socket.js";

export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    const userId = req.userId;

    const admin = await User.findById(userId);

    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    const validateMembers = await User.find({ _id: { $in: members } });
    if (validateMembers.length !== members.length) {
      return res.status(404).json({ message: "One or more members not found" });
    }

    const newGroup = new Group({
      name,
      members,
      admin: userId,
    });

    await newGroup.save();
    console.log("About to notify new group:", newGroup);
    notifyNewGroup(newGroup);
    console.log("Notification sent for new group");
    return res.status(201).json({ group: newGroup });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const group = await Group.find({
      $or: [{ admin: userId }, { members: userId }],
    }).sort({ updatedAt: -1 });

    return res.status(200).json({ groups: group });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

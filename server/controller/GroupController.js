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
    const userId = new mongoose.Types.ObjectId(req.userId);

    // Trova i gruppi in cui l'utente è membro o admin
    const activeGroups = await Group.find({
      $or: [{ admin: userId }, { members: userId }],
    })
      .sort({ updatedAt: -1 })
      .populate("members", "id email username image avatar userName")
      .populate("admin", "id email username image avatar userName");

    // Trova le informazioni dell'utente per controllare i gruppi da cui è stato rimosso
    const user = await User.findById(userId);

    // Se l'utente non ha gruppi rimossi, restituisci solo quelli attivi
    if (!user.removedGroups || user.removedGroups.length === 0) {
      const groupsWithActiveFlag = activeGroups.map((group) => ({
        ...group.toObject(),
        isActive: true,
        userRemoved: false,
        userLeft: false,
      }));

      return res.status(200).json({ groups: groupsWithActiveFlag });
    }

    // Crea un array con gli ID dei gruppi rimossi
    const removedGroupIds = user.removedGroups.map((item) =>
      item.groupId.toString()
    );

    // Crea una mappa con le informazioni dettagliate per ogni gruppo rimosso
    const removedGroupsInfo = {};
    user.removedGroups.forEach((item) => {
      if (item.groupId) {
        removedGroupsInfo[item.groupId.toString()] = {
          left: !!item.left, // Converti in booleano esplicito
        };
      }
    });

    // Filtra per escludere i gruppi che sono sia attivi che rimossi
    const activeGroupIds = activeGroups.map((group) => group._id.toString());
    const filteredRemovedGroupIds = removedGroupIds.filter(
      (id) => !activeGroupIds.includes(id)
    );

    // Se non ci sono gruppi rimossi dopo il filtraggio, restituisci solo quelli attivi
    if (filteredRemovedGroupIds.length === 0) {
      const groupsWithActiveFlag = activeGroups.map((group) => ({
        ...group.toObject(),
        isActive: true,
        userRemoved: false,
        userLeft: false,
      }));

      return res.status(200).json({ groups: groupsWithActiveFlag });
    }

    // Altrimenti, trova i dettagli dei gruppi rimossi
    const removedGroups = await Group.find({
      _id: { $in: filteredRemovedGroupIds },
    })
      .populate("members", "id email username image avatar userName")
      .populate("admin", "id email username image avatar userName");

    // Aggiungi i flag corretti ad ogni gruppo attivo
    const formattedActiveGroups = activeGroups.map((group) => ({
      ...group.toObject(),
      isActive: true,
      userRemoved: false,
      userLeft: false,
    }));

    // Aggiungi i flag corretti ad ogni gruppo rimosso
    const formattedRemovedGroups = removedGroups.map((group) => {
      const groupInfo = removedGroupsInfo[group._id.toString()] || {};
      return {
        ...group.toObject(),
        isActive: false,
        userRemoved: !groupInfo.left, // Se non è left, è removed
        userLeft: !!groupInfo.left, // Converti in booleano esplicito
      };
    });

    // Combina i due array e restituisci il risultato
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

// Rimuovere un membro dal gruppo
export const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.body;
    const userId = req.userId;

    // Verificare che il gruppo esista
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Verificare che l'utente corrente sia l'admin del gruppo
    if (group.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    // Verificare che l'admin non stia cercando di rimuovere se stesso
    if (memberId === userId) {
      return res.status(400).json({
        message: "Admin cannot remove themselves using this endpoint",
      });
    }

    // Rimuovere il membro dal gruppo
    await Group.findByIdAndUpdate(groupId, {
      $pull: { members: memberId },
    });

    await User.findByIdAndUpdate(memberId, {
      $push: { removedGroups: { groupId } },
    });

    // Recupera il gruppo aggiornato
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

// Uscire dal gruppo
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const userId = req.userId;

    // Verificare che il gruppo esista
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Se l'utente è l'admin, non può semplicemente uscire
    // (deve prima cambiare admin o eliminare il gruppo)
    if (group.admin.toString() === userId) {
      return res
        .status(400)
        .json({ message: "Admin must assign new admin before leaving" });
    }

    // Rimuovere l'utente dai membri del gruppo
    await Group.findByIdAndUpdate(groupId, {
      $pull: { members: userId },
    });

    // Aggiungere il gruppo alla lista dei gruppi rimossi dell'utente, ma con un flag left=true
    await User.findByIdAndUpdate(userId, {
      $push: { removedGroups: { groupId, left: true } },
    });

    return res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Cambiare l'admin del gruppo
export const changeAdmin = async (req, res) => {
  try {
    const { groupId, newAdminId } = req.body;
    const userId = req.userId;

    // Verificare che il gruppo esista
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Verificare che l'utente corrente sia l'admin del gruppo
    if (group.admin.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Only current admin can change admin" });
    }

    // Verificare che il nuovo admin sia un membro del gruppo
    if (!group.members.includes(newAdminId)) {
      return res
        .status(400)
        .json({ message: "New admin must be a member of the group" });
    }

    // Aggiornare l'admin del gruppo
    group.admin = newAdminId;
    await group.save();

    return res.status(200).json({ message: "Admin changed successfully" });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Eliminare il gruppo
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    // Verificare che il gruppo esista
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Verificare che l'utente corrente sia l'admin del gruppo
    if (group.admin.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Only admin can delete the group" });
    }

    // Eliminare il gruppo
    await Group.findByIdAndDelete(groupId);

    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    // Trova il gruppo e popola tutti i riferimenti necessari
    const group = await Group.findById(groupId)
      .populate("members", "userName email avatar image isOnline")
      .populate("admin", "userName email avatar image isOnline");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Verifica che l'utente richiedente sia membro o admin del gruppo
    const isMember = group.members.some(
      (member) => member._id.toString() === userId
    );
    const isAdmin = group.admin._id.toString() === userId;

    // Controlla se l'utente è stato rimosso o ha lasciato il gruppo
    const user = await User.findById(userId);
    const removedGroupEntry =
      user.removedGroups &&
      user.removedGroups.find(
        (item) => item.groupId && item.groupId.toString() === groupId
      );

    // Aggiungi i flag allo stato del gruppo
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

    if (
      !groupId ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Verificare che il gruppo esista
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Verificare che l'utente corrente sia l'admin del gruppo
    if (group.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    // Verificare che gli utenti da aggiungere esistano
    const users = await User.find({ _id: { $in: memberIds } });
    if (users.length !== memberIds.length) {
      return res.status(400).json({ message: "One or more users not found" });
    }

    // Filtrare gli utenti che sono già membri del gruppo
    const currentMemberIds = group.members.map((member) => member.toString());
    const newMemberIds = memberIds.filter(
      (id) => !currentMemberIds.includes(id)
    );

    if (newMemberIds.length === 0) {
      return res.status(400).json({ message: "All users are already members" });
    }

    // Per ogni nuovo membro, rimuovi il gruppo dalla sua lista removedGroups se presente
    for (const memberId of newMemberIds) {
      await User.updateOne(
        { _id: memberId },
        { $pull: { removedGroups: { groupId } } }
      );
    }

    // Aggiungere i nuovi membri al gruppo
    group.members.push(...newMemberIds);
    await group.save();

    // Recuperare il gruppo aggiornato con i membri popolati
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

    // Verifica che il gruppo esista
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Verifica che l'utente sia membro o admin del gruppo
    const isMember = group.members.some(
      (member) => member.toString() === userId
    );
    const isAdmin = group.admin.toString() === userId;

    if (!isMember && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this group's media" });
    }

    // Recupera tutti i messaggi con file del gruppo
    const fileMessages = await Message.find({
      _id: { $in: group.messages },
      messageType: "file",
    })
      .populate("sender", "userName avatar image")
      .sort({ timestamp: -1 });

    // Formatta i risultati per la risposta
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

// Funzione di supporto per determinare il tipo di file
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
    return "application/octet-stream";
  }
}

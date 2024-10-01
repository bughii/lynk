import { User } from "../models/UserModel.js";

import { Friendship } from "../models/friendsModel.js";

// Send a friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body; // Recipient ID
    const requesterId = req.userId; // Requester ID

    // Checking if the friendship already exists
    const existingFriendship = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        return res.status(400).json({ message: "Siete già amici." });
      }

      if (existingFriendship.status === "pending") {
        return res.status(400).json({ message: "Richiesta già inviata." });
      }
    }

    // Creating a new friendship request
    const friendship = new Friendship({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });

    await friendship.save();
    res.status(200).json({ message: "Richiesta di amicizia inviata." });
  } catch (error) {
    res.status(500).json({ message: "Errore nel processo.", error });
  }
};

// Get the list of received friend requests
export const getReceivedRequests = async (req, res) => {
  try {
    const userId = req.userId;

    // Find a pending friendship request where the current user is the recipient
    // And return the requester's information
    const receivedRequests = await Friendship.find({
      recipient: userId,
      status: "pending",
    }).populate("requester", "userName avatar image");

    if (!receivedRequests.length) {
      return res.status(404).json({ message: "Nessuna richiesta trovata." });
    }

    res.status(200).json({ receivedRequests });
  } catch (error) {
    console.log("Errore nel recupero delle richieste.", error);
    res
      .status(500)
      .json({ message: "Errore nel recupero delle richieste.", error });
  }
};

// Get the list of sent friend requests
export const getSentRequests = async (req, res) => {
  try {
    const userId = req.userId;

    // Find a pending friendship request where the current user is the requester
    const sentRequests = await Friendship.find({
      requester: userId,
      status: "pending",
    }).populate("recipient", "userName avatar image");

    res.status(200).json({ sentRequests });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Errore nel recupero delle richieste.", error });
  }
};

// Accept a friend request
export const acceptRequest = async (req, res) => {
  const { requestId } = req.body;

  if (!requestId) {
    return res.status(400).json({ message: "ID della richiesta mancante." });
  }

  try {
    // Find the friendship request by ID
    const friendshipRequest = await Friendship.findById(requestId);

    if (!friendshipRequest) {
      return res.status(404).json({ message: "Richiesta non trovata." });
    }

    // Check if the request is already accepted
    if (friendshipRequest.status === "accepted") {
      return res.status(400).json({ message: "Richiesta già accettata." });
    }

    // Update the friendship request status to "accepted"
    friendshipRequest.status = "accepted";
    await friendshipRequest.save();

    // Create a new friendship document
    const newFriendship = new Friendship({
      requester: friendshipRequest.requester,
      recipient: friendshipRequest.recipient,
      status: "accepted",
    });

    await newFriendship.save();

    return res.status(200).json({
      message: "Richiesta di amicizia accettata con successo.",
      friendship: newFriendship,
    });
  } catch (error) {
    console.error("Errore nell'accettare la richiesta:", error);
    return res.status(500).json({
      message: "Errore nel server. Riprova più tardi.",
      error: error.message,
    });
  }
};

// Reject a friend request
export const rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    // Update the friendship request status to "rejected"
    const friendship = await Friendship.findByIdAndUpdate(
      requestId,
      { status: "rejected" },
      { new: true }
    );

    if (!friendship) {
      return res.status(404).json({ message: "Richiesta non trovata." });
    }

    // Delete the friendship request
    await Friendship.findByIdAndDelete(requestId);

    res.status(200).json({ message: "Richiesta di amicizia rifiutata." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Errore nel rifiutare la richiesta.", error });
  }
};

// Get the list of friends for the current user
export const getFriends = async (req, res) => {
  try {
    const userId = req.userId;

    // Find all accepted friendships where the current user is the requester or recipient
    const friends = await Friendship.find({
      $or: [
        { requester: userId, status: "accepted" },
        { recipient: userId, status: "accepted" },
      ],
    }).populate("requester recipient", "userName avatar image");

    // Format the result to return only the friend (not the current user)
    const formattedFriends = friends.map((friendship) => {
      if (friendship.requester._id.toString() === userId) {
        return {
          _id: friendship.recipient._id,
          userName: friendship.recipient.userName,
          avatar: friendship.recipient.avatar,
          image: friendship.recipient.image,
        };
      } else {
        return {
          _id: friendship.requester._id,
          userName: friendship.requester.userName,
          avatar: friendship.requester.avatar,
          image: friendship.requester.image,
        };
      }
    });

    // Remove duplicates from the list
    const uniqueFriends = Array.from(
      new Map(formattedFriends.map((friend) => [friend._id, friend])).values()
    );

    res.status(200).json({ friends: uniqueFriends });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Errore nel recupero degli amici.", error });
  }
};

// Remove a friend from the list
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.userId;

    if (!friendId) {
      return res.status(400).json({ message: "Friend ID required" });
    }

    // Find a friendship document where the current user is the requester or recipient and delete it
    const friendship = await Friendship.findOneAndDelete({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId },
      ],
    });

    if (!friendship) {
      return res.status(404).json({ message: "Friendship not found" });
    }

    return res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({ message: "Internal server error" });
  }
};

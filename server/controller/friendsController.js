import { User } from "../models/UserModel.js";
import mongoose from "mongoose";
import { Message } from "../models/MessagesModel.js";
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

export const getReceivedRequests = async (req, res) => {
  try {
    const userId = req.userId;

    // Find a pending friendship request where the current user is the recipient
    // And return the requester's information
    const receivedRequests = await Friendship.find({
      recipient: userId,
      status: "pending",
    }).populate("requester", "userName avatar image");

    // Restituire un array vuoto invece di un errore se non ci sono richieste
    res.status(200).json({ receivedRequests: receivedRequests || [] });
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

    return res.status(200).json({
      message: "Richiesta di amicizia accettata con successo.",
      friendship: friendshipRequest,
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

    console.log("Fetching friends for user:", userId);

    // Find all accepted friendships where the current user is the requester or recipient
    const friends = await Friendship.find({
      $or: [
        { requester: userId, status: "accepted" },
        { recipient: userId, status: "accepted" },
      ],
    }).populate("requester recipient", "userName avatar image");

    console.log("Found friendships:", friends.length);

    // Format the result to return only the friend (not the current user)
    const formattedFriends = [];

    for (const friendship of friends) {
      try {
        // Verifico se requester esiste e ha un _id
        if (friendship.requester && friendship.requester._id) {
          const requesterId = friendship.requester._id.toString();

          // Se requester è l'utente corrente, restituisco recipient
          if (requesterId === userId) {
            if (friendship.recipient && friendship.recipient._id) {
              formattedFriends.push({
                _id: friendship.recipient._id,
                userName: friendship.recipient.userName || "Unknown User",
                avatar: friendship.recipient.avatar,
                image: friendship.recipient.image,
              });
            }
          }
          // Altrimenti, restituisco requester
          else {
            formattedFriends.push({
              _id: friendship.requester._id,
              userName: friendship.requester.userName || "Unknown User",
              avatar: friendship.requester.avatar,
              image: friendship.requester.image,
            });
          }
        }
      } catch (err) {
        console.error("Error processing friendship:", err);
        // Continua con la prossima amicizia anche se questa causa errori
      }
    }

    console.log("Formatted friends:", formattedFriends.length);

    // Remove duplicates by ID to be safe
    const uniqueIds = new Set();
    const uniqueFriends = [];

    for (const friend of formattedFriends) {
      const friendId = friend._id.toString();
      if (!uniqueIds.has(friendId)) {
        uniqueIds.add(friendId);
        uniqueFriends.push(friend);
      }
    }

    console.log("Unique friends:", uniqueFriends.length);

    return res.status(200).json({ friends: uniqueFriends });
  } catch (error) {
    console.error("Error in getFriends:", error);
    return res.status(500).json({
      message: "Errore nel recupero degli amici.",
      error: error.message,
    });
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

export const searchFriends = async (req, res) => {
  try {
    const { searchTerm } = req.body;

    if (!searchTerm) {
      return res.status(400).json({ message: "Search term required" });
    }

    // Sanitize the search term
    const sanitizedSearchTerm = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    // The search term is sanitized and case insensitive
    const regex = new RegExp(sanitizedSearchTerm, "i");

    // Trova tutte le amicizie accettate in cui l'utente è il requester o il recipient
    const friendships = await Friendship.find({
      status: "accepted",
      $or: [{ requester: req.userId }, { recipient: req.userId }],
    }).populate("requester recipient");

    // Filtra gli amici che corrispondono al termine di ricerca
    const friends = friendships
      .map((friendship) => {
        // Identifica chi è l'amico in base a chi non è l'utente loggato
        return friendship.requester._id.toString() === req.userId
          ? friendship.recipient
          : friendship.requester;
      })
      .filter((friend) => regex.test(friend.userName)); // Applica il filtro del termine di ricerca

    return res.status(200).json({ friends });
  } catch (error) {
    console.log({ error });
    return res.status(500).send("Internal server error");
  }
};

export const getFriendsForPreview = async (req, res) => {
  try {
    let { userId } = req;

    userId = new mongoose.Types.ObjectId(userId);
    const friends = await Message.aggregate([
      {
        // Find all messages where the user is the sender or recipient
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
        },
      },
      {
        // Sort the messages from the latest to the oldest
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            // Determine who is the friend
            $cond: {
              if: { $eq: ["$sender", userId] },
              then: "$recipient",
              else: "$sender",
            },
          },
          lastMessageTime: { $first: "$timestamp" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "friend",
        },
      },
      {
        $unwind: "$friend",
      },
      {
        $project: {
          _id: 1,
          userName: "$friend.userName",
          email: "$friend.email",
          avatar: "$friend.avatar",
          image: "$friend.image",
          isOnline: "$friend.isOnline",
          lastMessageTime: 1,
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);

    return res.status(200).json({ friends });
  } catch (error) {
    console.log({ error });
  }
};

export const resetUnreadCount = async (req, res) => {
  try {
    const userId = req.params.userId;
    await User.findByIdAndUpdate(userId, { unreadMessagesCount: 0 });

    res.status(200).json({ message: "Unread count reset" });
  } catch (error) {
    console.log({ error });
    res.status(500).json({ message: "Internal server error" });
  }
};

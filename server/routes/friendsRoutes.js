import express, { Router } from "express";
import {
  sendFriendRequest,
  getReceivedRequests,
  getSentRequests,
  acceptRequest,
  rejectRequest,
  getFriends,
  removeFriend,
  searchFriends,
  getFriendsForPreview,
  resetUnreadCount,
} from "../controller/friendsController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const friendsRoutes = Router();

friendsRoutes.post("/send-request", verifyToken, sendFriendRequest);
friendsRoutes.get("/received-requests", verifyToken, getReceivedRequests);
friendsRoutes.get("/sent-requests", verifyToken, getSentRequests);
friendsRoutes.post("/accept-request", verifyToken, acceptRequest);
friendsRoutes.post("/reject-request", verifyToken, rejectRequest);
friendsRoutes.get("/get-friends", verifyToken, getFriends);
friendsRoutes.post("/remove-friend", verifyToken, removeFriend);
friendsRoutes.post("/search-friends", verifyToken, searchFriends);
friendsRoutes.get("/get-friends-preview", verifyToken, getFriendsForPreview);
friendsRoutes.post("/:userId/resetUnreadCount", verifyToken, resetUnreadCount);

export default friendsRoutes;

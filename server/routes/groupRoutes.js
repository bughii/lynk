import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  createGroup,
  getUserGroups,
  getGroupMessages,
  removeMember,
  leaveGroup,
  deleteGroup,
  changeAdmin,
  getGroupDetails,
  addMembers,
  getGroupMedia,
} from "../controller/GroupController.js";

const groupRoutes = Router();

groupRoutes.post("/create-group", verifyToken, createGroup);
groupRoutes.get("/get-user-groups", verifyToken, getUserGroups);
groupRoutes.get("/get-group-messages/:groupId", verifyToken, getGroupMessages);
groupRoutes.post("/remove-member", verifyToken, removeMember);
groupRoutes.post("/leave-group", verifyToken, leaveGroup);
groupRoutes.delete("/delete-group/:groupId", verifyToken, deleteGroup);
groupRoutes.post("/change-admin", verifyToken, changeAdmin);
groupRoutes.get("/get-group-details/:groupId", verifyToken, getGroupDetails);
groupRoutes.post("/add-members", verifyToken, addMembers);
groupRoutes.get("/get-group-media/:groupId", verifyToken, getGroupMedia);

export default groupRoutes;

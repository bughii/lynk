import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { createGroup } from "../controller/GroupController.js";
import { getUserGroups } from "../controller/GroupController.js";
import { getGroupMessages } from "../controller/GroupController.js";

const groupRoutes = Router();

groupRoutes.post("/create-group", verifyToken, createGroup);
groupRoutes.get("/get-user-groups", verifyToken, getUserGroups);
groupRoutes.get("/get-group-messages/:groupId", verifyToken, getGroupMessages);

export default groupRoutes;

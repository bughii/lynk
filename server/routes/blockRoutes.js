import { Router } from "express";
import {
  blockUser,
  unblockUser,
  checkBlockStatus,
  getBlockedUsers,
} from "../controller/blockController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const blockRoutes = Router();

blockRoutes.post("/block", verifyToken, blockUser);
blockRoutes.post("/unblock", verifyToken, unblockUser);
blockRoutes.get("/status/:targetUserId", verifyToken, checkBlockStatus);
blockRoutes.get("/list", verifyToken, getBlockedUsers);

export default blockRoutes;

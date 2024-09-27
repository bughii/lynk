import { Router } from "express";
import { getMessages } from "../controller/messagesController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const messagesRoutes = Router();

messagesRoutes.post("/get-messages", verifyToken, getMessages);

export default messagesRoutes;

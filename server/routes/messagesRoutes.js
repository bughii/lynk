import { Router } from "express";
import { getMessages } from "../controller/messagesController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { uploadFile } from "../controller/messagesController.js";
import { updateMessageAppearance } from "../controller/messagesController.js";
import multer from "multer";

const messagesRoutes = Router();
const upload = multer({ dest: "uploads/files" });

messagesRoutes.post("/get-messages", verifyToken, getMessages);
messagesRoutes.post(
  "/upload-file",
  verifyToken,
  upload.single("file"),
  uploadFile
);
messagesRoutes.post("/update-appearance", verifyToken, updateMessageAppearance);

export default messagesRoutes;

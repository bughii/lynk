import { Router } from "express";
import {
  login,
  addProfileImage,
  removeProfileImage,
  signup,
  logout,
} from "../controller/authenticationController.js";
import { verifyEmail } from "../controller/authenticationController.js";
import { forgotPassword } from "../controller/authenticationController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { checkAuth } from "../controller/authenticationController.js";
import { updateProfile } from "../controller/authenticationController.js";
import { resetPassword } from "../controller/authenticationController.js";
import multer from "multer";

const authenticationRoutes = Router();

const upload = multer({ dest: "uploads/profiles" });

authenticationRoutes.get("/check-auth", verifyToken, checkAuth);
authenticationRoutes.post("/signup", signup);
authenticationRoutes.post("/login", login);

authenticationRoutes.post("/update-profile", verifyToken, updateProfile);
authenticationRoutes.post(
  "/add-profile-image",
  verifyToken,
  upload.single("profile-image"),
  addProfileImage
);
authenticationRoutes.delete(
  "/remove-profile-image",
  verifyToken,
  removeProfileImage
);

authenticationRoutes.post("/verify-email", verifyEmail);
authenticationRoutes.post("/forgot-password", forgotPassword);
authenticationRoutes.post("/reset-password/:token", resetPassword);
authenticationRoutes.post("/logout", logout);

export default authenticationRoutes;

import { Router } from "express";
import { login, signup } from "../controller/authenticationController.js";
import { getUserInfo } from "../controller/authenticationController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const authenticationRoutes = Router();

authenticationRoutes.post("/signup", signup);
authenticationRoutes.post("/login", login);
authenticationRoutes.get("/user-info", verifyToken, getUserInfo);

export default authenticationRoutes;

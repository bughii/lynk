import { Router } from "express";
import { SearchContacts } from "../controller/contactsController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const contactRoutes = Router();

contactRoutes.post("/search", verifyToken, SearchContacts);

export default contactRoutes;

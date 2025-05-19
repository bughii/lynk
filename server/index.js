import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authenticationRoutes from "./routes/authenticationRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import setupSocket from "./socket.js";
import messagesRoutes from "./routes/messagesRoutes.js";
import friendsRoutes from "./routes/friendsRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import { User } from "./models/UserModel.js";
import blockRoutes from "./routes/blockRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";

// Dotenv config
dotenv.config();

const app = express();
const port = process.env.PORT || 5005;
const databaseURL = process.env.DATABASE_URL;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Add middleware to debug API requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} called from ${req.ip}`);
  next();
});

app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files", express.static("uploads/files"));

app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authenticationRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/friendship", friendsRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/block", blockRoutes);
app.use("/api", healthRoutes);

const server = app.listen(port, () => {
  console.log(`Server sta runnando sulla porta ${port}`);
});

setupSocket(server);

// Reset the online status of all users when the server starts
async function resetAllUsersOnlineStatus() {
  try {
    const result = await User.updateMany({}, { isOnline: false });
    console.log("Stati resettati");
  } catch (error) {
    console.error("Errore nel reset degli stati online:", error);
  }
}

mongoose
  .connect(databaseURL)
  .then(() => {
    console.log("Connesso al database");
    resetAllUsersOnlineStatus();
  })
  .catch((error) => console.log(error));

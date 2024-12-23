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

// Dotenv config
dotenv.config();

const app = express();
const port = process.env.PORT || 5005;
const databaseURL = process.env.DATABASE_URL;

// Cors config
app.use(
  cors({
    origin: [process.env.ORIGIN],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files", express.static("uploads/files"));

app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authenticationRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/friendship", friendsRoutes);
app.use("/api/groups", groupRoutes);

const server = app.listen(port, () => {
  console.log(`Server sta runnando sulla porta ${port}`);
});

setupSocket(server);

mongoose
  .connect(databaseURL)
  .then(() => console.log("Connesso al database"))
  .catch((error) => console.log(error));

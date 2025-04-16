// Integration tests for the messages endpoints using Vitest and Supertest.
// Endpoints tested:
//   POST /api/messages/get-messages
//   POST /api/messages/upload-file
//   POST /api/messages/update-appearance
import request from "supertest";
import express from "express";
import dotenv from "dotenv";
import { describe, it, beforeEach, expect, vi } from "vitest";

// Load env variables if needed
dotenv.config();

vi.mock("fs", async () => {
  const actualFs = await vi.importActual("fs");
  return {
    ...actualFs,
    mkdirSync: vi.fn(),
    renameSync: vi.fn(),
  };
});
// Import fs using named imports
import * as fs from "fs";

// Set up Express app with messages routes
import messagesRoutes from "../routes/messagesRoutes.js";
const app = express();
app.use(express.json());
app.use("/api/messages", messagesRoutes);

// Mock verifyToken middleware to set req.userId and call next()
vi.mock("../middleware/verifyToken.js", () => ({
  verifyToken: (req, res, next) => {
    req.userId = "1";
    next();
  },
}));

// Mock Message model
vi.mock("../models/MessagesModel.js", () => {
  return {
    Message: {
      find: vi.fn(),
      updateMany: vi.fn(),
    },
  };
});
import { Message } from "../models/MessagesModel.js";

// Mock BlockedUser model
vi.mock("../models/BlockedUserModel.js", () => {
  return {
    BlockedUser: {
      findOne: vi.fn(),
    },
  };
});
import { BlockedUser } from "../models/BlockedUserModel.js";

describe("Messages Endpoints", () => {
  beforeEach(() => {
    // Clear mocks before each test.
    vi.clearAllMocks();
  });

  // Test for POST /api/messages/get-messages
  describe("POST /api/messages/get-messages", () => {
    it("should return 200 and a list of messages when successful (no block)", async () => {
      // Fake messages for testing
      const fakeMessages = [
        {
          _id: "msg1",
          timestamp: new Date("2025-04-13T10:00:00Z"),
          sender: { _id: "1", email: "user1@example.com", userName: "User1" },
          recipient: {
            _id: "2",
            email: "user2@example.com",
            userName: "User2",
          },
        },
        {
          _id: "msg2",
          timestamp: new Date("2025-04-13T10:05:00Z"),
          sender: { _id: "2", email: "user2@example.com", userName: "User2" },
          recipient: {
            _id: "1",
            email: "user1@example.com",
            userName: "User1",
          },
        },
      ];
      // Mock Message.find chain to return fakeMessages
      Message.find.mockReturnValue({
        sort: () => ({
          populate: () => ({
            populate: () => Promise.resolve(fakeMessages),
          }),
        }),
      });
      // Simulate that no block exists
      BlockedUser.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/messages/get-messages")
        .send({ id: "2" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("messages");
      expect(Array.isArray(res.body.messages)).toBe(true);
      expect(res.body.messages).toHaveLength(fakeMessages.length);
    });

    it("should return 400 if userId or other user id is missing", async () => {
      const res = await request(app)
        .post("/api/messages/get-messages")
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Both user IDs required");
    });
  });

  // Test for POST /api/messages/upload-file
  describe("POST /api/messages/upload-file", () => {
    it("should return 400 if no file is uploaded", async () => {
      const res = await request(app).post("/api/messages/upload-file");
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "No file uploaded");
    });

    it("should upload the file and return 200 with filePath", async () => {
      // attach() to simulate file upload.
      const res = await request(app)
        .post("/api/messages/upload-file")
        .attach("file", Buffer.from("dummy file content"), "test.txt");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "File uploaded");
      expect(res.body).toHaveProperty("filePath");

      // Verify that fs.mkdirSync and fs.renameSync were called
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.renameSync).toHaveBeenCalled();
    });
  });

  // Test for POST /api/messages/update-appearance
  describe("POST /api/messages/update-appearance", () => {
    it("should update message appearance and return 200 with settings", async () => {
      // Mock updateMany calls to resolve with an object indicating success.
      Message.updateMany.mockResolvedValue({ nModified: 1 });

      const res = await request(app)
        .post("/api/messages/update-appearance")
        .send({
          sentMessageColor: "#0000FF",
          receivedMessageColor: "#00FF00",
          fontSize: "medium",
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("settings");
      expect(res.body.settings).toEqual({
        sentMessageColor: "#0000FF",
        receivedMessageColor: "#00FF00",
        fontSize: "medium",
      });
      // Expect two updateMany calls (one for sender, one for recipient).
      expect(Message.updateMany).toHaveBeenCalledTimes(2);
    });
  });
});

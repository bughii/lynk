// tests/friends.test.js
//
// Integration tests for the friends endpoints using Vitest and Supertest.
// Endpoints tested:
//   POST   /api/friendship/send-request
//   GET    /api/friendship/received-requests
//   GET    /api/friendship/sent-requests
//   POST   /api/friendship/accept-request
//   POST   /api/friendship/reject-request
//   GET    /api/friendship/get-friends
//   POST   /api/friendship/remove-friend
//   POST   /api/friendship/search-friends
//   GET    /api/friendship/get-friends-preview
//   POST   /api/friendship/:userId/resetUnreadCount
//
// Run these tests with: npm run test:backend

import request from "supertest";
import express from "express";
import { describe, it, beforeEach, expect, vi, waitFor } from "vitest";
import dotenv from "dotenv";

// Load environment variables if needed.
dotenv.config();

// ----------------------------------------------------------------
// Set Up Express App with Friends Routes
// ----------------------------------------------------------------
import friendsRoutes from "../routes/friendsRoutes.js";
const app = express();
app.use(express.json());
// Mount the friends routes under /api/friendship
app.use("/api/friendship", friendsRoutes);

// ----------------------------------------------------------------
// Mocks for Middleware and Models
// ----------------------------------------------------------------

// Mock verifyToken middleware to always set req.userId to a valid ObjectId.
vi.mock("../middleware/verifyToken.js", () => ({
  verifyToken: (req, res, next) => {
    req.userId = "507f191e810c19729de860ea"; // valid test ObjectId
    next();
  },
}));

// ---------- Mock Friendship Model ----------
// Fake Friendship constructor and attach static methods—all within the factory.
vi.mock("../models/friendsModel.js", () => {
  const FakeFriendship = vi.fn((data) => ({
    ...data,
    status: "pending",
    save: vi.fn().mockResolvedValue({ ...data, status: "pending" }),
  }));
  FakeFriendship.findOne = vi.fn();
  FakeFriendship.find = vi.fn();
  FakeFriendship.findById = vi.fn();
  FakeFriendship.findByIdAndUpdate = vi.fn();
  FakeFriendship.findByIdAndDelete = vi.fn();
  FakeFriendship.findOneAndDelete = vi.fn();
  return { Friendship: FakeFriendship };
});
import { Friendship } from "../models/friendsModel.js";

// ---------- Mock User Model (for resetUnreadCount) ----------
vi.mock("../models/UserModel.js", () => ({
  User: {
    findByIdAndUpdate: vi.fn(),
  },
}));
import { User } from "../models/UserModel.js";

// ---------- Mock Message Model (for get-friends-preview) ----------
vi.mock("../models/MessagesModel.js", () => ({
  Message: {
    aggregate: vi.fn(),
  },
}));
import { Message } from "../models/MessagesModel.js";

// ----------------------------------------------------------------
// Begin Friends Endpoints Integration Tests
// ----------------------------------------------------------------
describe("Friends Endpoints", () => {
  beforeEach(() => {
    // Clear all mocks before each test.
    vi.clearAllMocks();
  });

  // -------------------------------
  // POST /send-request
  // -------------------------------
  describe("POST /api/friendship/send-request", () => {
    it("should send a friend request when no existing request exists", async () => {
      // Simulate no existing friendship.
      Friendship.findOne.mockResolvedValue(null);
      // Override the constructor for creation.
      vi.mocked(Friendship).mockImplementation((data) => ({
        ...data,
        status: "pending",
        save: vi.fn().mockResolvedValue({ ...data, status: "pending" }),
      }));

      const res = await request(app)
        .post("/api/friendship/send-request")
        .send({ recipientId: "2" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Richiesta di amicizia inviata."
      );
    });

    it("should return 400 if friendship already exists and is accepted", async () => {
      Friendship.findOne.mockResolvedValue({ status: "accepted" });
      const res = await request(app)
        .post("/api/friendship/send-request")
        .send({ recipientId: "2" });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Siete già amici.");
    });

    it("should return 400 if friendship already exists and is pending", async () => {
      Friendship.findOne.mockResolvedValue({ status: "pending" });
      const res = await request(app)
        .post("/api/friendship/send-request")
        .send({ recipientId: "2" });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Richiesta già inviata.");
    });
  });

  // -------------------------------
  // GET /received-requests
  // -------------------------------
  describe("GET /api/friendship/received-requests", () => {
    it("should return a list of received friend requests", async () => {
      const fakeRequests = [
        {
          _id: "r1",
          status: "pending",
          requester: {
            _id: "2",
            userName: "User2",
            avatar: "avatar2",
            image: "img2",
          },
        },
        {
          _id: "r2",
          status: "pending",
          requester: {
            _id: "3",
            userName: "User3",
            avatar: "avatar3",
            image: "img3",
          },
        },
      ];
      // Return an object with populate method.
      Friendship.find.mockReturnValue({
        populate: () => Promise.resolve(fakeRequests),
      });

      const res = await request(app)
        .get("/api/friendship/received-requests")
        .set("Accept", "application/json");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("receivedRequests");
      expect(Array.isArray(res.body.receivedRequests)).toBe(true);
      expect(res.body.receivedRequests).toHaveLength(fakeRequests.length);
    });
  });

  // -------------------------------
  // GET /sent-requests
  // -------------------------------
  describe("GET /api/friendship/sent-requests", () => {
    it("should return a list of sent friend requests", async () => {
      const fakeRequests = [
        {
          _id: "s1",
          status: "pending",
          recipient: {
            _id: "2",
            userName: "User2",
            avatar: "avatar2",
            image: "img2",
          },
        },
      ];
      Friendship.find.mockReturnValue({
        populate: () => Promise.resolve(fakeRequests),
      });
      const res = await request(app)
        .get("/api/friendship/sent-requests")
        .set("Accept", "application/json");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("sentRequests");
      expect(Array.isArray(res.body.sentRequests)).toBe(true);
      expect(res.body.sentRequests).toHaveLength(fakeRequests.length);
    });
  });

  // -------------------------------
  // POST /accept-request
  // -------------------------------
  describe("POST /api/friendship/accept-request", () => {
    it("should accept a friend request and return 200", async () => {
      const fakeFriendship = {
        _id: "req1",
        status: "pending",
        save: vi.fn().mockResolvedValue({ _id: "req1", status: "accepted" }),
      };
      Friendship.findById.mockResolvedValue(fakeFriendship);

      const res = await request(app)
        .post("/api/friendship/accept-request")
        .send({ requestId: "req1" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Richiesta di amicizia accettata con successo."
      );
      expect(res.body).toHaveProperty("friendship");
      expect(fakeFriendship.save).toHaveBeenCalled();
    });

    it("should return 400 if requestId is missing", async () => {
      const res = await request(app)
        .post("/api/friendship/accept-request")
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        "message",
        "ID della richiesta mancante."
      );
    });

    it("should return 404 if the friend request is not found", async () => {
      Friendship.findById.mockResolvedValue(null);
      const res = await request(app)
        .post("/api/friendship/accept-request")
        .send({ requestId: "nonexistent" });
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Richiesta non trovata.");
    });
  });

  // -------------------------------
  // POST /reject-request
  // -------------------------------
  describe("POST /api/friendship/reject-request", () => {
    it("should reject a friend request and return 200", async () => {
      Friendship.findByIdAndUpdate.mockResolvedValue({
        _id: "req1",
        status: "rejected",
      });
      Friendship.findByIdAndDelete.mockResolvedValue({ _id: "req1" });

      const res = await request(app)
        .post("/api/friendship/reject-request")
        .send({ requestId: "req1" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Richiesta di amicizia rifiutata."
      );
    });

    it("should return 404 if the friend request to reject is not found", async () => {
      Friendship.findByIdAndUpdate.mockResolvedValue(null);
      const res = await request(app)
        .post("/api/friendship/reject-request")
        .send({ requestId: "nonexistent" });
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Richiesta non trovata.");
    });
  });

  // -------------------------------
  // GET /get-friends
  // -------------------------------
  describe("GET /api/friendship/get-friends", () => {
    it("should return a list of friends for the current user", async () => {
      const fakeFriendships = [
        {
          _id: "f1",
          requester: {
            _id: "507f191e810c19729de860ea",
            userName: "User1",
            avatar: "avatar1",
            image: "img1",
          },
          recipient: {
            _id: "2",
            userName: "User2",
            avatar: "avatar2",
            image: "img2",
          },
          status: "accepted",
        },
        {
          _id: "f2",
          requester: {
            _id: "3",
            userName: "User3",
            avatar: "avatar3",
            image: "img3",
          },
          recipient: {
            _id: "507f191e810c19729de860ea",
            userName: "User1",
            avatar: "avatar1",
            image: "img1",
          },
          status: "accepted",
        },
      ];
      Friendship.find.mockReturnValue({
        populate: () => Promise.resolve(fakeFriendships),
      });

      const res = await request(app)
        .get("/api/friendship/get-friends")
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("friends");
      expect(Array.isArray(res.body.friends)).toBe(true);
      expect(res.body.friends.length).toBe(2);
    });
  });

  // -------------------------------
  // POST /remove-friend
  // -------------------------------
  describe("POST /api/friendship/remove-friend", () => {
    it("should remove a friend and return 200", async () => {
      Friendship.findOneAndDelete.mockResolvedValue({ _id: "f1" });
      const res = await request(app)
        .post("/api/friendship/remove-friend")
        .send({ friendId: "2" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Friend removed successfully");
    });

    it("should return 400 if friendId is missing", async () => {
      const res = await request(app)
        .post("/api/friendship/remove-friend")
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Friend ID required");
    });

    it("should return 404 if friendship is not found", async () => {
      Friendship.findOneAndDelete.mockResolvedValue(null);
      const res = await request(app)
        .post("/api/friendship/remove-friend")
        .send({ friendId: "nonexistent" });
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Friendship not found");
    });
  });

  // -------------------------------
  // POST /search-friends
  // -------------------------------
  describe("POST /api/friendship/search-friends", () => {
    it("should return a list of friends matching the search term", async () => {
      const fakeFriendships = [
        {
          _id: "s1",
          status: "accepted",
          requester: {
            _id: "507f191e810c19729de860ea",
            userName: "TestUser",
            avatar: "avatar1",
            image: "img1",
          },
          recipient: {
            _id: "2",
            userName: "Alice",
            avatar: "avatar2",
            image: "img2",
          },
        },
        {
          _id: "s2",
          status: "accepted",
          requester: {
            _id: "3",
            userName: "Bob",
            avatar: "avatar3",
            image: "img3",
          },
          recipient: {
            _id: "507f191e810c19729de860ea",
            userName: "TestUser",
            avatar: "avatar1",
            image: "img1",
          },
        },
      ];
      Friendship.find.mockReturnValue({
        populate: () => Promise.resolve(fakeFriendships),
      });

      const res = await request(app)
        .post("/api/friendship/search-friends")
        .send({ searchTerm: "Alice" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("friends");
      expect(res.body.friends.length).toBe(1);
      expect(res.body.friends[0].userName).toBe("Alice");
    });

    it("should return 400 if search term is missing", async () => {
      const res = await request(app)
        .post("/api/friendship/search-friends")
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Search term required");
    });
  });

  // -------------------------------
  // GET /get-friends-preview
  // -------------------------------
  describe("GET /api/friendship/get-friends-preview", () => {
    it("should return a list of friends for preview using aggregation", async () => {
      const fakeAggregationResult = [
        {
          _id: "2",
          userName: "Alice",
          email: "alice@example.com",
          avatar: "avatar2",
          image: "img2",
          isOnline: true,
          lastMessageTime: new Date(),
        },
        {
          _id: "3",
          userName: "Bob",
          email: "bob@example.com",
          avatar: "avatar3",
          image: "img3",
          isOnline: false,
          lastMessageTime: new Date(),
        },
      ];
      Message.aggregate.mockResolvedValue(fakeAggregationResult);
      const res = await request(app)
        .get("/api/friendship/get-friends-preview")
        .set("Accept", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("friends");
      expect(Array.isArray(res.body.friends)).toBe(true);
      expect(res.body.friends.length).toBe(fakeAggregationResult.length);
    });
  });

  // -------------------------------
  // POST /:userId/resetUnreadCount
  // -------------------------------
  describe("POST /api/friendship/:userId/resetUnreadCount", () => {
    it("should reset unread count for the given user and return 200", async () => {
      User.findByIdAndUpdate.mockResolvedValue({
        _id: "507f191e810c19729de860ea",
        unreadMessagesCount: 0,
      });
      const res = await request(app)
        .post("/api/friendship/507f191e810c19729de860ea/resetUnreadCount")
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Unread count reset");
    });

    it("should return 500 if an error occurs during reset", async () => {
      User.findByIdAndUpdate.mockRejectedValue(new Error("Test Error"));
      const res = await request(app)
        .post("/api/friendship/507f191e810c19729de860ea/resetUnreadCount")
        .send();

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("message", "Internal server error");
    });
  });
});

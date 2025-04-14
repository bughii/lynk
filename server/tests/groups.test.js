// tests/groups.test.js
//
// Integration tests for the Groups endpoints using Vitest and Supertest.
// Tested endpoints include:
//   POST    /api/groups/create-group
//   GET     /api/groups/get-user-groups
//   GET     /api/groups/get-group-messages/:groupId
//   DELETE  /api/groups/delete-group/:groupId
//   GET     /api/groups/get-group-details/:groupId
//   POST    /api/groups/add-members
//   GET     /api/groups/get-group-media/:groupId
//   POST    /api/groups/:userId/resetUnreadCount
//
// Run these tests via: npm run test:backend

import request from "supertest";
import express from "express";
import { describe, it, beforeEach, expect, vi, waitFor } from "vitest";
import dotenv from "dotenv";

// Load environment variables if needed.
dotenv.config();

// ----------------------------------------------------------------
// SET UP EXPRESS APP WITH GROUPS ROUTES
// ----------------------------------------------------------------
import groupRoutes from "../routes/groupRoutes.js";
const app = express();
app.use(express.json());
app.use("/api/groups", groupRoutes);

// ----------------------------------------------------------------
// MOCKS FOR MIDDLEWARE AND MODELS
// ----------------------------------------------------------------

// --- verifyToken Middleware ---
// Always sets req.userId to a valid fixed ObjectId.
vi.mock("../middleware/verifyToken.js", () => ({
  verifyToken: (req, res, next) => {
    req.userId = "507f191e810c19729de860ea"; // valid 24-character ObjectId
    next();
  },
}));

// --- Group Model ---
// Provide a fake Group class that mimics a Mongoose model.
vi.mock("../models/GroupModel.js", () => {
  class FakeGroup {
    constructor(data) {
      Object.assign(this, data);
      this.messages = data.messages || [];
      this.isDeleted = data.isDeleted || false;
      this.deletedAt = data.deletedAt || null;
      this.deletedBy = data.deletedBy || null;
      this._id = "group123";
    }
    async save() {
      // Simulate a save by simply resolving to the instance.
      return this;
    }
    toObject() {
      return { ...this };
    }
  }
  // Static methods used by controllers:
  FakeGroup.find = vi.fn();
  FakeGroup.findById = vi.fn();
  FakeGroup.findByIdAndUpdate = vi.fn();
  return { Group: FakeGroup };
});
import { Group } from "../models/GroupModel.js";

// --- Message Model ---
// Provide a fake Message class used for creating system messages.
vi.mock("../models/MessagesModel.js", () => {
  class FakeMessage {
    constructor(data) {
      Object.assign(this, data);
      this._id = "msg123";
    }
    async save() {
      return this;
    }
  }
  FakeMessage.aggregate = vi.fn();
  return { Message: FakeMessage };
});
import { Message } from "../models/MessagesModel.js";

// --- BlockedUser Model ---
// Default mock returns an empty array (no blocking by default).
vi.mock("../models/BlockedUserModel.js", () => ({
  BlockedUser: {
    find: vi.fn().mockResolvedValue([]),
  },
}));
import { BlockedUser } from "../models/BlockedUserModel.js";

// --- User Model ---
// Provide mocks for methods used by group endpoints.
vi.mock("../models/UserModel.js", () => ({
  User: {
    findById: vi.fn(),
    find: vi.fn(),
    updateOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));
import { User } from "../models/UserModel.js";

// ----------------------------------------------------------------
// GROUPS ENDPOINTS INTEGRATION TESTS
// ----------------------------------------------------------------
describe("Groups Endpoints", () => {
  beforeEach(() => {
    // Clear all mocks before each test.
    vi.clearAllMocks();
  });

  // -------------------------------
  // POST /create-group
  // -------------------------------
  describe("POST /api/groups/create-group", () => {
    it("should create a new group successfully", async () => {
      const groupData = {
        name: "Test Group",
        members: ["507f191e810c19729de860eb", "507f191e810c19729de860ec"],
      };

      // Simulate finding the admin user.
      User.findById.mockResolvedValue({
        _id: "507f191e810c19729de860ea",
        userName: "AdminUser",
      });
      // Simulate that all member IDs exist.
      User.find.mockResolvedValue(groupData.members.map((id) => ({ _id: id })));
      // No blocking relationships.
      BlockedUser.find.mockResolvedValue([]);

      // When creating a new group, our controller calls 'new Group()' and then save().
      // Our FakeGroup.save() will simply resolve to the FakeGroup instance.
      // The controller then creates a system message and pushes its _id into group.messages.
      // To simulate that, we override the save() method of the created group instance so that
      // after pushing "msg123" the save() returns an object with messages including "msg123".
      // We do that by spying on Group.findByIdAndUpdate below.

      // We do not need to override the Group constructor here;
      // the controller uses "new Group({...})" and then calls save().
      // Our FakeGroup automatically sets _id = "group123" and our FakeMessage sets _id = "msg123".

      // Simulate system message creation.
      vi.spyOn(Message.prototype, "save").mockResolvedValue({ _id: "msg123" });

      const res = await request(app)
        .post("/api/groups/create-group")
        .send(groupData);

      // Expect a 201 response.
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("group");
      // Check that the group messages array includes the system message id "msg123".
      expect(res.body.group.messages).toContain("msg123");
    });

    it("should return 400 if group name or members are missing", async () => {
      const res = await request(app)
        .post("/api/groups/create-group")
        .send({ name: "", members: [] });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        "message",
        "Group name and at least one member are required"
      );
    });

    it("should return 403 if blocking relationships exist", async () => {
      // Simulate a blocking relationship exists.
      BlockedUser.find.mockResolvedValue([
        {
          blocker: "507f191e810c19729de860ea",
          blocked: "507f191e810c19729de860eb",
          createdAt: new Date(),
        },
      ]);
      const res = await request(app)
        .post("/api/groups/create-group")
        .send({
          name: "Test Group",
          members: ["507f191e810c19729de860eb"],
        });
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty(
        "message",
        "Cannot add blocked users to group"
      );
      expect(res.body.blockedUserIds).toContain("507f191e810c19729de860eb");
    });

    it("should return 404 if admin user is not found", async () => {
      User.findById.mockResolvedValue(null);
      const res = await request(app)
        .post("/api/groups/create-group")
        .send({
          name: "Test Group",
          members: ["507f191e810c19729de860eb"],
        });
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Admin user not found");
    });

    it("should return 404 if one or more members are not found", async () => {
      User.findById.mockResolvedValue({ _id: "507f191e810c19729de860ea" });
      // Simulate that no members are found.
      User.find.mockResolvedValue([]);
      const res = await request(app)
        .post("/api/groups/create-group")
        .send({
          name: "Test Group",
          members: ["507f191e810c19729de860eb"],
        });
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty(
        "message",
        "One or more members not found"
      );
    });
  });

  // -------------------------------
  // GET /get-user-groups
  // -------------------------------
  describe("GET /api/groups/get-user-groups", () => {
    it("should return active groups for the user", async () => {
      const fakeGroups = [
        {
          _id: "g1",
          name: "Group 1",
          admin: "507f191e810c19729de860ea",
          members: ["507f191e810c19729de860ea", "507f191e810c19729de860eb"],
          toObject: function () {
            return this;
          },
        },
        {
          _id: "g2",
          name: "Group 2",
          admin: "507f191e810c19729de860ea",
          members: ["507f191e810c19729de860ea", "507f191e810c19729de860ec"],
          toObject: function () {
            return this;
          },
        },
      ];
      Group.find.mockResolvedValue(fakeGroups);
      // Simulate that the user has no removedGroups.
      User.findById.mockResolvedValue({
        _id: "507f191e810c19729de860ea",
        removedGroups: [],
      });

      const res = await request(app)
        .get("/api/groups/get-user-groups")
        .set("Accept", "application/json");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("groups");
      expect(Array.isArray(res.body.groups)).toBe(true);
      res.body.groups.forEach((group) => {
        expect(group.isActive).toBe(true);
        expect(group.userRemoved).toBe(false);
        expect(group.userLeft).toBe(false);
      });
    });
  });

  // -------------------------------
  // GET /get-group-messages/:groupId
  // -------------------------------
  describe("GET /api/groups/get-group-messages/:groupId", () => {
    it("should return group messages if group exists", async () => {
      const fakeGroup = {
        _id: "g1",
        messages: [{ _id: "m1", content: "Hello" }],
      };
      // Simulate Group.findById chain with populate.
      Group.findById.mockResolvedValue({
        ...fakeGroup,
        populate: vi.fn().mockResolvedValue(fakeGroup),
      });

      const res = await request(app)
        .get("/api/groups/get-group-messages/g1")
        .set("Accept", "application/json");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("messages");
      expect(Array.isArray(res.body.messages)).toBe(true);
      expect(res.body.messages.length).toBe(fakeGroup.messages.length);
    });

    it("should return 404 if group is not found", async () => {
      Group.findById.mockResolvedValue(null);
      const res = await request(app)
        .get("/api/groups/get-group-messages/nonexistent")
        .set("Accept", "application/json");
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Group not found");
    });
  });

  // -------------------------------
  // DELETE /delete-group/:groupId
  // -------------------------------
  describe("DELETE /api/groups/delete-group/:groupId", () => {
    it("should mark the group as deleted and return 200", async () => {
      const fakeGroup = {
        _id: "g1",
        admin: "507f191e810c19729de860ea",
        messages: [],
        isDeleted: false,
        save: vi.fn().mockImplementation(function () {
          // Simulate deletion by setting flags.
          this.isDeleted = true;
          this.deletedAt = new Date();
          this.deletedBy = "507f191e810c19729de860ea";
          return Promise.resolve(this);
        }),
      };
      Group.findById.mockResolvedValue(fakeGroup);
      // Override Message constructor for system message creation.
      // Use our fake Message: new Message(...) returns an object with _id "msg123".
      // (Our previous mock of FakeMessage already sets _id to "msg123".)
      vi.spyOn(Message.prototype, "save").mockResolvedValue({ _id: "msg123" });

      const res = await request(app)
        .delete("/api/groups/delete-group/g1")
        .set("Accept", "application/json");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Group deleted successfully");
      expect(res.body.group).toHaveProperty("isDeleted", true);
      expect(fakeGroup.save).toHaveBeenCalled();
    });

    it("should return 404 if group is not found", async () => {
      Group.findById.mockResolvedValue(null);
      const res = await request(app)
        .delete("/api/groups/delete-group/nonexistent")
        .set("Accept", "application/json");
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Group not found");
    });

    it("should return 403 if current user is not the admin", async () => {
      const fakeGroup = { _id: "g1", admin: "otherUser", save: vi.fn() };
      Group.findById.mockResolvedValue(fakeGroup);
      const res = await request(app)
        .delete("/api/groups/delete-group/g1")
        .set("Accept", "application/json");
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty(
        "message",
        "Only admin can delete the group"
      );
    });
  });

  // -------------------------------
  // GET /get-group-details/:groupId
  // -------------------------------
  describe("GET /api/groups/get-group-details/:groupId", () => {
    it("should return group details with proper flags", async () => {
      const fakeGroup = {
        _id: "g1",
        name: "Test Group",
        admin: { _id: "otherUser", userName: "AdminUser" },
        members: [{ _id: "507f191e810c19729de860ea", userName: "TestUser" }],
        toObject: function () {
          return this;
        },
      };
      Group.findById.mockResolvedValue({
        ...fakeGroup,
        populate: vi.fn().mockResolvedValue(fakeGroup),
      });
      // Simulate that the user has no removed groups.
      User.findById.mockResolvedValue({
        _id: "507f191e810c19729de860ea",
        removedGroups: [],
      });
      const res = await request(app)
        .get("/api/groups/get-group-details/g1")
        .set("Accept", "application/json");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("group");
      expect(res.body.group).toHaveProperty("isActive", true);
      expect(res.body.group).toHaveProperty("userRemoved", false);
      expect(res.body.group).toHaveProperty("userLeft", false);
    });

    it("should return 404 if group is not found", async () => {
      Group.findById.mockResolvedValue(null);
      const res = await request(app)
        .get("/api/groups/get-group-details/nonexistent")
        .set("Accept", "application/json");
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Group not found");
    });
  });

  // -------------------------------
  // POST /add-members
  // -------------------------------
  describe("POST /api/groups/add-members", () => {
    it("should add new members to the group and return updated group", async () => {
      const groupId = "g1";
      const newMemberIds = [
        "507f191e810c19729de860eb",
        "507f191e810c19729de860ec",
      ];
      const fakeGroup = {
        _id: groupId,
        admin: "507f191e810c19729de860ea",
        members: ["507f191e810c19729de860ea"],
        save: vi.fn().mockImplementation(function () {
          // Simulate adding members by mutating this.members.
          return Promise.resolve(this);
        }),
      };
      Group.findById.mockResolvedValue(fakeGroup);
      // Simulate that the new members exist.
      User.find.mockResolvedValue(newMemberIds.map((id) => ({ _id: id })));

      const res = await request(app)
        .post("/api/groups/add-members")
        .send({ groupId, memberIds: newMemberIds });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Members added successfully");
      // Check that fakeGroup.members now includes the new members.
      expect(fakeGroup.members).toEqual(expect.arrayContaining(newMemberIds));
    });

    it("should return 400 if request data is invalid", async () => {
      const res = await request(app)
        .post("/api/groups/add-members")
        .send({ groupId: "", memberIds: [] });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Invalid request data");
    });

    it("should return 403 if blocked users are included", async () => {
      BlockedUser.find.mockResolvedValue([
        {
          blocker: "507f191e810c19729de860ea",
          blocked: "507f191e810c19729de860eb",
        },
      ]);
      const res = await request(app)
        .post("/api/groups/add-members")
        .send({ groupId: "g1", memberIds: ["507f191e810c19729de860eb"] });
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty(
        "message",
        "Cannot add blocked users to group"
      );
    });
  });

  // -------------------------------
  // GET /get-group-media/:groupId
  // -------------------------------
  describe("GET /api/groups/get-group-media/:groupId", () => {
    it("should return group media if the user is authorized", async () => {
      const fakeGroup = {
        _id: "g1",
        admin: "507f191e810c19729de860ea",
        members: ["507f191e810c19729de860ea", "507f191e810c19729de860eb"],
        messages: ["m1", "m2"],
      };
      Group.findById.mockResolvedValue(fakeGroup);
      const fakeFileMessages = [
        {
          _id: "m1",
          fileURL: "uploads/files/test.pdf",
          messageType: "file",
          timestamp: new Date(),
        },
      ];
      // Simulate Message.find chain for file messages.
      Message.find = vi
        .fn()
        .mockReturnValue({
          populate: vi.fn().mockResolvedValue(fakeFileMessages),
        });

      const res = await request(app)
        .get("/api/groups/get-group-media/g1")
        .set("Accept", "application/json");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("files");
      expect(Array.isArray(res.body.files)).toBe(true);
      expect(res.body.files.length).toBe(fakeFileMessages.length);
    });

    it("should return 403 if the user is not authorized to view media", async () => {
      const fakeGroup = {
        _id: "g1",
        admin: "507f191e810c19729de860ea",
        members: ["507f191e810c19729de860ea"],
      };
      Group.findById.mockResolvedValue(fakeGroup);
      const res = await request(app)
        .get("/api/groups/get-group-media/g1")
        .set("Accept", "application/json");
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty(
        "message",
        "Not authorized to view this group's media"
      );
    });
  });

  // -------------------------------
  // POST /:userId/resetUnreadCount
  // -------------------------------
  describe("POST /api/groups/:userId/resetUnreadCount", () => {
    it("should reset unread count for the given user and return 200", async () => {
      User.findByIdAndUpdate.mockResolvedValue({
        _id: "507f191e810c19729de860ea",
        unreadMessagesCount: 0,
      });
      const res = await request(app)
        .post("/api/groups/507f191e810c19729de860ea/resetUnreadCount")
        .send();
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Unread count reset");
    });

    it("should return 500 if an error occurs during reset", async () => {
      User.findByIdAndUpdate.mockRejectedValue(new Error("Test Error"));
      const res = await request(app)
        .post("/api/groups/507f191e810c19729de860ea/resetUnreadCount")
        .send();
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("message", "Internal server error");
    });
  });
});

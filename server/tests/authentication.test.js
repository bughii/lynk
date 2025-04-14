// Integration tests for Authentication endpoints using Supertest and Vitest.
// This file tests the /api/auth/signup and /api/auth/login endpoints.
// All external dependencies (database, token generation, emails, etc.) are mocked.

import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import { describe, it, beforeEach, expect, vi } from "vitest";

// Load environment variables
dotenv.config();

// --------------------
// Set Up Express App for Testing
// --------------------
import authenticationRoutes from "../routes/authenticationRoutes.js";
const app = express();
app.use(cors({ origin: "*" })); // Allow all origins
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authenticationRoutes);

// --------------------
// Mocks for External Dependencies
// --------------------

// Mock the User model (simulate Mongoose model behavior)
vi.mock("../models/UserModel.js", () => {
  class FakeUser {
    constructor(data) {
      // Simulate Mongoose _doc structure for returned data
      this._doc = { ...data };
      // Simulate an instance method "save" that resolves with the instance.
      this.save = vi.fn().mockResolvedValue(this);
    }
  }
  // Static methods used in controllers
  FakeUser.findOne = vi.fn();
  FakeUser.findById = vi.fn();
  FakeUser.findByIdAndUpdate = vi.fn();
  FakeUser.updateMany = vi.fn();
  return { User: FakeUser };
});
import { User } from "../models/UserModel.js";

// Mock generateVerificationToken to always return a fixed token.
vi.mock("../utils/generateVerificationToken.js", () => ({
  generateVerificationToken: () => "fake-verification-token",
}));

// Mock generateTokenAndSetCookie to simulate setting a cookie.
vi.mock("../utils/generateTokenAndSetCookie.js", () => ({
  generateTokenAndSetCookie: vi.fn((res, userId) => {
    res.cookie("token", "fake-token");
  }),
}));
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";

// Mock email functions to prevent sending real emails.
vi.mock("../emails/emails.js", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(),
  sendWelcomeEmail: vi.fn().mockResolvedValue(),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(),
  sendResetSuccessEmail: vi.fn().mockResolvedValue(),
}));

// Use the real bcryptjs library but spy on its functions for hashing and comparing.
import bcryptjs from "bcryptjs";

// --------------------
// Integration Tests for Authentication Endpoints
// --------------------
describe("Authentication Endpoints", () => {
  beforeEach(() => {
    // Clear all mocks before each test run.
    vi.clearAllMocks();
  });

  // ----------- Signup Endpoint Tests -----------
  describe("POST /api/auth/signup", () => {
    it("should create a new user and return 201 when signup is successful", async () => {
      // Simulate no user exists with the provided email/username.
      User.findOne.mockResolvedValue(null);

      // Spy on bcryptjs.hash to simulate password hashing.
      vi.spyOn(bcryptjs, "hash").mockResolvedValue("hashedPassword");

      // Make a POST request to the signup endpoint.
      const res = await request(app).post("/api/auth/signup").send({
        email: "test@example.com",
        password: "password123",
        userName: "testuser",
      });

      // Expect a 201 Created response.
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty(
        "message",
        "Utente registrato con successo"
      );
      expect(res.body).toHaveProperty("email", "test@example.com");

      // The password field should not be returned.
      expect(res.body.password).toBeUndefined();

      // Verify that the token was set via generateTokenAndSetCookie.
      expect(generateTokenAndSetCookie).toHaveBeenCalled();
    });

    it("should return 400 if required fields are missing", async () => {
      // Missing email field results in a 400 error.
      const res = await request(app).post("/api/auth/signup").send({
        email: "",
        password: "password123",
        userName: "testuser",
      });
      expect(res.status).toBe(400);
    });

    it("should return 400 if email is already in use", async () => {
      // Simulate an existing user with the same email.
      User.findOne.mockResolvedValue({
        email: "test@example.com",
        userName: "testuser",
      });

      const res = await request(app).post("/api/auth/signup").send({
        email: "test@example.com",
        password: "password123",
        userName: "anotherUser",
      });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errorType", "email_in_use");
    });
  });

  // ----------- Login Endpoint Tests -----------
  describe("POST /api/auth/login", () => {
    it("should login a user with correct credentials and return a token", async () => {
      // Create a fake user instance that simulates a found user in the database.
      const fakeUser = new User({
        _id: "1",
        email: "test@example.com",
        userName: "testuser",
        password: "hashedPassword",
      });
      User.findOne.mockResolvedValue(fakeUser);

      // Spy on bcryptjs.compare to simulate a correct password match.
      vi.spyOn(bcryptjs, "compare").mockResolvedValue(true);

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty(
        "message",
        "Login effettuato con successo"
      );
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("test@example.com");

      // Ensure the password field is not returned.
      expect(res.body.user.password).toBeUndefined();
    });

    it("should return 400 for non-existent user", async () => {
      // Simulate that no user was found for the email.
      User.findOne.mockResolvedValue(null);

      const res = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Credenziali non valide");
    });

    it("should return 400 for invalid password", async () => {
      // Create a fake user instance.
      const fakeUser = new User({
        _id: "1",
        email: "test@example.com",
        userName: "testuser",
        password: "hashedPassword",
      });
      User.findOne.mockResolvedValue(fakeUser);

      // Spy on bcryptjs.compare to simulate a password mismatch.
      vi.spyOn(bcryptjs, "compare").mockResolvedValue(false);

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body).toHaveProperty("message", "Credenziali non valide");
    });
  });
});

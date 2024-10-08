import mongoose from "mongoose";
import { Schema } from "mongoose";

// Definisco lo schema dell'utente
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password required"],
    },
    userName: {
      type: String,
      required: false,
      unique: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      required: false,
    },
    avatar: {
      type: Number,
      required: false,
    },
    profileSetup: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    unreadMessagesCount: {
      type: Number,
      default: 0,
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
  },
  { timestamps: true }
);

export const User = mongoose.model("Users", userSchema);

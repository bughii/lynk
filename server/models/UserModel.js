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
      type: Object, // Store as a plain object
      default: {},
    },
    unreadGroupMessagesCount: {
      type: Object,
      default: {},
    },

    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  console.log("Saving user document:", this);
  next();
});

userSchema.post("save", function (doc) {
  console.log("Saved user document:", doc);
});

export const User = mongoose.model("Users", userSchema);

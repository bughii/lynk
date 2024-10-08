import mongoose from "mongoose";
import { User } from "./UserModel.js";

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
  ],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Messages",
      required: false,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

GroupSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

GroupSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

export const Group = mongoose.model("Groups", GroupSchema);
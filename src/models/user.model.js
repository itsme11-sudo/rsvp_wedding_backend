import mongoose from "mongoose";
import { INVITATION_ROLES } from "../constants/invitation-roles.js";

const userSchema = new mongoose.Schema(
  {
    codeHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    reservedSeats: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    role: {
      type: String,
      enum: ["admin", "invited"],
      default: "invited",
      index: true,
    },
    invitationRole: {
      type: String,
      enum: INVITATION_ROLES,
      default: "guest",
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

export const User = mongoose.model("User", userSchema);

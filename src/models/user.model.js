import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Invitation codes are sensitive, so only their hashes are stored.
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
  },
  { timestamps: true, versionKey: false },
);

export const User = mongoose.model("User", userSchema);

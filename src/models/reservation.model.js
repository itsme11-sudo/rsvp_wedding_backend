import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    isAttending: {
      type: Boolean,
      required: true,
    },
    companions: {
      type: Number,
      required: true,
      min: 0,
      max: 19,
    },
    companionNames: {
      type: [String],
      default: [],
      validate: {
        validator: (names) => names.length <= 19,
        message: "Too many companion names.",
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { timestamps: true, versionKey: false },
);

export const Reservation = mongoose.model("Reservation", reservationSchema);

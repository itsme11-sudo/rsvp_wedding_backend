import mongoose from "mongoose";

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is required.");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");
}

export async function disconnectFromDatabase() {
  await mongoose.disconnect();
}

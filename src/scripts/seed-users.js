import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectToDatabase, disconnectFromDatabase } from "../config/database.js";
import { normalizeInvitationRole } from "../constants/invitation-roles.js";
import { User } from "../models/user.model.js";
import { hashCode, normalizeCode } from "../utils/code.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultFile = path.resolve(currentDirectory, "../../data/users.json");
const inputFile = path.resolve(process.argv[2] ?? defaultFile);

async function seedUsers() {
  const input = JSON.parse(await readFile(inputFile, "utf8"));

  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("The users seed file must be a non-empty JSON array.");
  }

  await connectToDatabase();

  for (const entry of input) {
    const code = normalizeCode(entry.code);
    const name = String(entry.name ?? "").trim();
    const reservedSeats = Number(entry.reservedSeats);
    const role = entry.role ?? "invited";
    const invitationRole = normalizeInvitationRole(entry.invitationRole ?? "guest");

    if (
      !code ||
      !name ||
      !Number.isInteger(reservedSeats) ||
      reservedSeats < 1 ||
      !invitationRole
    ) {
      throw new Error(`Invalid seed user: ${JSON.stringify(entry)}`);
    }

    await User.findOneAndUpdate(
      { codeHash: hashCode(code) },
      { $set: { name, reservedSeats, role, invitationRole } },
      { upsert: true, runValidators: true },
    );
  }

  console.log(`Imported ${input.length} user(s).`);
}

seedUsers()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(disconnectFromDatabase);

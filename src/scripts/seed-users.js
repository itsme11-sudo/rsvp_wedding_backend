import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectToDatabase, disconnectFromDatabase } from "../config/database.js";
import {
  normalizeInvitationRole,
  normalizeInvitationRoleAssignments,
} from "../constants/invitation-roles.js";
import { User } from "../models/user.model.js";
import { hashCode, normalizeCode } from "../utils/code.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultFile = path.resolve(currentDirectory, "../../data/users.json");
const argumentsList = process.argv.slice(2);
let inputFileArgument;
let requestedCode;

for (let index = 0; index < argumentsList.length; index += 1) {
  const argument = argumentsList[index];

  if (argument === "--only") {
    requestedCode = normalizeCode(argumentsList[index + 1]);
    index += 1;
    if (!requestedCode) {
      throw new Error("--only requires an invitation code.");
    }
  } else if (!inputFileArgument) {
    inputFileArgument = argument;
  } else {
    throw new Error(`Unexpected seeder argument: ${argument}`);
  }
}

const inputFile = path.resolve(inputFileArgument ?? defaultFile);

async function seedUsers() {
  const input = JSON.parse(await readFile(inputFile, "utf8"));

  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("The users seed file must be a non-empty JSON array.");
  }

  const selectedUsers = requestedCode
    ? input.filter((entry) => normalizeCode(entry.code) === requestedCode)
    : input;

  if (selectedUsers.length === 0) {
    throw new Error(`Invitation code not found in the seed file: ${requestedCode}`);
  }

  await connectToDatabase();

  for (const entry of selectedUsers) {
    const code = normalizeCode(entry.code);
    const name = String(entry.name ?? "").trim();
    const reservedSeats = Number(entry.reservedSeats);
    const role = entry.role ?? "invited";
    const invitationRole = normalizeInvitationRole(entry.invitationRole ?? "guest");
    const invitationRoles = normalizeInvitationRoleAssignments(entry.invitationRoles);

    if (
      !code ||
      !name ||
      !Number.isInteger(reservedSeats) ||
      reservedSeats < 1 ||
      !invitationRole ||
      !invitationRoles
    ) {
      throw new Error(`Invalid seed user: ${JSON.stringify(entry)}`);
    }

    await User.findOneAndUpdate(
      { codeHash: hashCode(code) },
      { $set: { name, reservedSeats, role, invitationRole, invitationRoles } },
      { upsert: true, runValidators: true },
    );
  }

  console.log(
    `Imported ${selectedUsers.length} user(s)${requestedCode ? ` for code ${requestedCode}` : ""}.`,
  );
}

seedUsers()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(disconnectFromDatabase);

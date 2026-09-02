import assert from "node:assert/strict";
import test from "node:test";
import {
  createInvitedUser,
  validateUserCode,
} from "../src/controllers/user.controller.js";
import { Reservation } from "../src/models/reservation.model.js";
import { User } from "../src/models/user.model.js";
import { hashCode } from "../src/utils/code.js";

test("admin guest creation hashes the code and creates only an invited user", async () => {
  const originalExists = User.exists;
  const originalCreate = User.create;
  let createdRecord;
  let responseStatus;
  let responseBody;

  User.exists = async () => null;
  User.create = async (record) => {
    createdRecord = record;
    return { id: "new-user", ...record };
  };

  try {
    await createInvitedUser(
      {
        body: {
          invitationCode: "  New Guest  ",
          name: "New Guest",
          reservedSeats: 2,
          invitationRole: "Brides maid",
        },
      },
      {
        status(status) {
          responseStatus = status;
          return this;
        },
        json(body) {
          responseBody = body;
          return this;
        },
      },
      (error) => {
        throw error;
      },
    );
  } finally {
    User.exists = originalExists;
    User.create = originalCreate;
  }

  assert.equal(responseStatus, 201);
  assert.equal(createdRecord.codeHash, hashCode("NEW GUEST"));
  assert.equal(createdRecord.role, "invited");
  assert.equal(createdRecord.invitationRole, "bridesmaid");
  assert.deepEqual(createdRecord.invitationRoles, [
    { name: "New Guest", roles: ["bridesmaid"] },
  ]);
  assert.equal(responseBody.user.name, "New Guest");
  assert.equal("invitationCode" in createdRecord, false);
});

test("admin guest creation does not overwrite an existing invitation code", async () => {
  const originalExists = User.exists;
  const originalCreate = User.create;
  let createWasCalled = false;
  let responseStatus;

  User.exists = async () => ({ _id: "existing-user" });
  User.create = async () => {
    createWasCalled = true;
  };

  try {
    await createInvitedUser(
      {
        body: {
          invitationCode: "Existing",
          name: "Existing Guest",
          reservedSeats: 1,
          invitationRole: "guest",
        },
      },
      {
        status(status) {
          responseStatus = status;
          return this;
        },
        json() {
          return this;
        },
      },
      (error) => {
        throw error;
      },
    );
  } finally {
    User.exists = originalExists;
    User.create = originalCreate;
  }

  assert.equal(responseStatus, 409);
  assert.equal(createWasCalled, false);
});

test("code validation returns the saved declined attendance state", async () => {
  const originalFindUser = User.findOne;
  const originalFindReservation = Reservation.findOne;
  let responseBody;

  User.findOne = () => ({
    select: async () => ({
      _id: "user-1",
      id: "user-1",
      name: "Declining Guest",
      reservedSeats: 1,
      role: "invited",
      invitationRole: "guest",
      invitationRoles: [],
    }),
  });
  Reservation.findOne = () => ({
    select: async () => ({ isAttending: false }),
  });

  try {
    await validateUserCode(
      { body: { code: "Declining Guest" } },
      {
        json(body) {
          responseBody = body;
          return this;
        },
      },
      (error) => {
        throw error;
      },
    );
  } finally {
    User.findOne = originalFindUser;
    Reservation.findOne = originalFindReservation;
  }

  assert.equal(responseBody.user.hasSubmittedRsvp, true);
  assert.equal(responseBody.user.submittedRsvpIsAttending, false);
});

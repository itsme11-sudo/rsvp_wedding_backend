import assert from "node:assert/strict";
import test from "node:test";
import { RSVP_ALREADY_SUBMITTED_MESSAGE } from "../src/constants/messages.js";
import { submitReservation } from "../src/controllers/reservation.controller.js";
import { Reservation } from "../src/models/reservation.model.js";

test("rejects a repeated RSVP before attempting another insert", async () => {
  const originalExists = Reservation.exists;
  const originalCreate = Reservation.create;
  let createWasCalled = false;
  let responseStatus = 0;
  let responseBody;

  Reservation.exists = async () => ({ _id: "existing-reservation" });
  Reservation.create = async () => {
    createWasCalled = true;
  };

  const response = {
    status(status) {
      responseStatus = status;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  try {
    await submitReservation(
      { invitedUser: { _id: "invited-user", reservedSeats: 2 }, body: {} },
      response,
      (error) => {
        throw error;
      },
    );
  } finally {
    Reservation.exists = originalExists;
    Reservation.create = originalCreate;
  }

  assert.equal(responseStatus, 409);
  assert.equal(responseBody.message, RSVP_ALREADY_SUBMITTED_MESSAGE);
  assert.equal(createWasCalled, false);
});

import assert from "node:assert/strict";
import test from "node:test";
import { RSVP_ALREADY_SUBMITTED_MESSAGE } from "../src/constants/messages.js";
import {
  sendWeddingReminders,
  submitReservation,
} from "../src/controllers/reservation.controller.js";
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

test("wedding reminders query only attending reservations that are not yet sent", async () => {
  const originalCountDocuments = Reservation.countDocuments;
  const originalFind = Reservation.find;
  const originalResendApiKey = process.env.RESEND_API_KEY;
  const originalResendFrom = process.env.RESEND_FROM;
  let reminderQuery;
  let responseBody;

  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM;
  Reservation.countDocuments = async () => 1;
  Reservation.find = (query) => {
    reminderQuery = query;
    return {
      populate: async () => [
        {
          _id: "reservation-1",
          name: "Attending Guest",
          email: "guest@example.com",
          isAttending: true,
          user: { name: "Attending Guest", invitationRoles: [] },
        },
      ],
    };
  };

  try {
    await sendWeddingReminders(
      {},
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
    Reservation.countDocuments = originalCountDocuments;
    Reservation.find = originalFind;
    if (originalResendApiKey) process.env.RESEND_API_KEY = originalResendApiKey;
    if (originalResendFrom) process.env.RESEND_FROM = originalResendFrom;
  }

  assert.deepEqual(reminderQuery, {
    isAttending: true,
    reminderSentAt: null,
  });
  assert.equal(responseBody.sent, 0);
  assert.equal(responseBody.failed, 1);
});

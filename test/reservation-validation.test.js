import assert from "node:assert/strict";
import test from "node:test";
import { validateReservationInput } from "../src/utils/reservation-validation.js";

test("accepts a valid attending RSVP", () => {
  const result = validateReservationInput(
    {
      name: "Juan Cruz",
      email: "juan@example.com",
      isAttending: true,
      companions: 1,
      companionNames: ["Maria Dela Cruz"],
      notes: "No allergies",
    },
    2,
  );

  assert.equal(result.error, undefined);
  assert.equal(result.value.companions, 1);
});

test("rejects companions beyond the reserved seat count", () => {
  const result = validateReservationInput(
    {
      name: "Juan Cruz",
      email: "juan@example.com",
      isAttending: true,
      companions: 2,
      companionNames: ["Maria", "Pedro"],
    },
    2,
  );

  assert.match(result.error, /between 0 and 1/);
});

test("clears companion data for a declining RSVP", () => {
  const result = validateReservationInput(
    {
      name: "Juan Cruz",
      email: "juan@example.com",
      isAttending: false,
      companions: 5,
      companionNames: ["Ignored"],
    },
    2,
  );

  assert.equal(result.value.companions, 0);
  assert.deepEqual(result.value.companionNames, []);
});

test("accepts a long email when its format is valid", () => {
  const email = `${"guest".repeat(60)}@example.com`;
  const result = validateReservationInput(
    {
      name: "Juan Cruz",
      email,
      isAttending: true,
      companions: 0,
      companionNames: [],
    },
    1,
  );

  assert.equal(result.error, undefined);
  assert.equal(result.value.email, email);
});

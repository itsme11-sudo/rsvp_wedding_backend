import assert from "node:assert/strict";
import test from "node:test";
import {
  isRsvpClosed,
  RSVP_CLOSES_AT,
} from "../src/constants/rsvp-deadline.js";

test("keeps RSVP open through September 3 in Philippine time", () => {
  assert.equal(RSVP_CLOSES_AT, "2026-09-04T00:00:00+08:00");
  assert.equal(isRsvpClosed(new Date("2026-09-03T15:59:59.999Z")), false);
});

test("closes RSVP at midnight on September 4 in Philippine time", () => {
  assert.equal(isRsvpClosed(new Date("2026-09-03T16:00:00.000Z")), true);
});

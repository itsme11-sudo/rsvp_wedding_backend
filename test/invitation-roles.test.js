import assert from "node:assert/strict";
import test from "node:test";
import { normalizeInvitationRole } from "../src/constants/invitation-roles.js";

test("normalizes invitation-role labels and common aliases", () => {
  assert.equal(normalizeInvitationRole("Principal Sponsor"), "principal-sponsor");
  assert.equal(normalizeInvitationRole("Brides maid"), "bridesmaid");
  assert.equal(normalizeInvitationRole("Bride's maid"), "bridesmaid");
  assert.equal(normalizeInvitationRole("Mathron of honor"), "matron-of-honor");
  assert.equal(normalizeInvitationRole("Cord"), "cord-sponsor");
  assert.equal(normalizeInvitationRole(), "guest");
});

test("rejects unknown invitation roles", () => {
  assert.equal(normalizeInvitationRole("unknown-role"), null);
});

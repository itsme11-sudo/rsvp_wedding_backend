import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeInvitationRole,
  normalizeInvitationRoleAssignments,
} from "../src/constants/invitation-roles.js";

test("normalizes invitation-role labels and common aliases", () => {
  assert.equal(normalizeInvitationRole("Principal Sponsor"), "principal-sponsor");
  assert.equal(normalizeInvitationRole("Brides maid"), "bridesmaid");
  assert.equal(normalizeInvitationRole("Bride's maid"), "bridesmaid");
  assert.equal(normalizeInvitationRole("Mathron of honor"), "matron-of-honor");
  assert.equal(normalizeInvitationRole("Cord"), "cord-sponsor");
  assert.equal(normalizeInvitationRole("groommen"), "groomsman");
  assert.equal(normalizeInvitationRole("Grooms father"), "father-of-the-groom");
  assert.equal(normalizeInvitationRole("Bestman"), "best-man");
  assert.equal(normalizeInvitationRole(), "guest");
});

test("supports multiple roles for the same named person", () => {
  assert.deepEqual(
    normalizeInvitationRoleAssignments([
      { name: "Juan", roles: ["Cord", "Groomsman"] },
    ]),
    [{ name: "Juan", roles: ["cord-sponsor", "groomsman"] }],
  );
});

test("rejects unknown invitation roles", () => {
  assert.equal(normalizeInvitationRole("unknown-role"), null);
});

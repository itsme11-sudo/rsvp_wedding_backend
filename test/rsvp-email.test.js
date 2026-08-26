import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAdminRsvpEmail,
  buildGuestRsvpEmail,
} from "../src/templates/rsvp-email.js";

const reservation = {
  name: "Juan & Maria <script>alert('x')</script>",
  email: "juan@example.com",
  isAttending: true,
  companions: 1,
  companionNames: ["Maria Dela Cruz"],
  notes: "Vegetarian meal, please.",
};

test("builds a burgundy guest confirmation with a text fallback", () => {
  const email = buildGuestRsvpEmail(reservation);

  assert.match(email.subject, /Thank you/);
  assert.match(email.text, /Total party size: 2/);
  assert.match(email.html, /#3b111c/);
  assert.match(email.html, /#671a2d/);
  assert.match(email.html, /Thank you for your response/);
  assert.match(email.html, /Maria Dela Cruz/);
});

test("escapes guest-provided content in HTML emails", () => {
  const guestEmail = buildGuestRsvpEmail(reservation);
  const adminEmail = buildAdminRsvpEmail(reservation);

  assert.doesNotMatch(guestEmail.html, /<script>/);
  assert.doesNotMatch(adminEmail.html, /<script>/);
  assert.match(guestEmail.html, /&lt;script&gt;/);
  assert.match(adminEmail.html, /Vegetarian meal, please\./);
});

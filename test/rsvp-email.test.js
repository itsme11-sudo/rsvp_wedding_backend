import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAdminRsvpEmail,
  buildGuestRsvpEmail,
  buildWeddingReminderEmail,
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

test("uses considerate wording when a guest declines", () => {
  const email = buildGuestRsvpEmail({
    ...reservation,
    isAttending: false,
    companions: 0,
    companionNames: [],
  });

  assert.match(email.text, /we will miss having you with us/i);
  assert.match(email.html, /grateful for your warm wishes from afar/i);
  assert.doesNotMatch(email.html, /We look forward to celebrating/i);
});

test("escapes guest-provided content in HTML emails", () => {
  const guestEmail = buildGuestRsvpEmail(reservation);
  const adminEmail = buildAdminRsvpEmail(reservation);

  assert.doesNotMatch(guestEmail.html, /<script>/);
  assert.doesNotMatch(adminEmail.html, /<script>/);
  assert.match(guestEmail.html, /&lt;script&gt;/);
  assert.match(adminEmail.html, /Vegetarian meal, please\./);
});

test("builds a wedding reminder with calendar and personalized roles", () => {
  const email = buildWeddingReminderEmail({
    ...reservation,
    user: {
      name: "Che & Family",
      invitationRole: "guest",
      invitationRoles: [
        { name: "Che", roles: ["bridesmaid"] },
        { name: "Erin", roles: ["flower-girl"] },
      ],
    },
  });

  assert.match(email.subject, /September 18, 2026/);
  assert.match(email.text, /Che will stand with us as one of our Bridesmaids/);
  assert.match(email.text, /Erin will join us as our Flower Girl/);
  assert.match(email.text, /calendar\.google\.com/);
  assert.match(email.html, /Add to Google Calendar/);
  assert.match(email.html, /#3b111c/);
});

test("uses a generic wedding reminder for guests without special roles", () => {
  const email = buildWeddingReminderEmail({
    ...reservation,
    user: { name: "Guest", invitationRole: "guest", invitationRoles: [] },
  });

  assert.doesNotMatch(email.text, /especially meaningful/);
  assert.match(email.text, /Thank you for confirming your RSVP/);
});

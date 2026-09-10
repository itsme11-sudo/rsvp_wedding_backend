import "dotenv/config";
import { randomUUID } from "node:crypto";
import { Resend } from "resend";
import { buildWeddingReminderEmail } from "../templates/rsvp-email.js";

const recipient = "lecamaisonline@gmail.com";
const recipientName = "Lec";

async function sendReminderSample() {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    throw new Error("Missing RESEND_API_KEY or RESEND_FROM in backend/.env");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send(
    {
      from: process.env.RESEND_FROM,
      to: recipient,
      ...(process.env.RSVP_REPLY_TO
        ? { replyTo: process.env.RSVP_REPLY_TO }
        : {}),
      ...buildWeddingReminderEmail({ name: recipientName, user: {} }),
    },
    { idempotencyKey: randomUUID() },
  );

  if (error) {
    throw new Error(error.message);
  }

  console.log(`Sample accepted for delivery to ${recipient}. Email ID: ${data.id}`);
}

sendReminderSample().catch((error) => {
  console.error("Sample email failed:", error.message);
  process.exitCode = 1;
});

import { Resend } from "resend";
import {
  buildAdminRsvpEmail,
  buildGuestRsvpEmail,
  buildWeddingReminderEmail,
} from "../templates/rsvp-email.js";

async function sendEmail(resend, message, label) {
  const { data, error } = await resend.emails.send(message);

  if (error) {
    console.error(`${label} failed:`, error.message ?? error);
    return { sent: false, reason: "send_failed" };
  }

  return { sent: true, id: data?.id };
}

export async function sendRsvpEmails(reservation) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    console.warn(
      "RSVP saved, but emails were skipped: Resend is not configured.",
    );
    return {
      guest: { sent: false, reason: "not_configured" },
      admin: { sent: false, reason: "not_configured" },
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const replyTo = process.env.RSVP_REPLY_TO;
  const guestEmail = buildGuestRsvpEmail(reservation);

  const guest = await sendEmail(
    resend,
    {
      from: process.env.RESEND_FROM,
      to: reservation.email,
      ...(replyTo ? { replyTo } : {}),
      ...guestEmail,
    },
    "Guest RSVP confirmation email",
  );

  let admin = { sent: false, reason: "not_configured" };
  if (process.env.RSVP_NOTIFICATION_EMAIL) {
    const adminEmail = buildAdminRsvpEmail(reservation);
    admin = await sendEmail(
      resend,
      {
        from: process.env.RESEND_FROM,
        to: process.env.RSVP_NOTIFICATION_EMAIL,
        ...(replyTo ? { replyTo } : {}),
        ...adminEmail,
      },
      "Admin RSVP notification email",
    );
  }

  return { guest, admin };
}

export async function sendWeddingReminderEmails(reservations) {
  const reservationIds = reservations.map((reservation) => reservation._id);

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    console.warn("Wedding reminders were skipped: Resend is not configured.");
    return { sentIds: [], failedIds: reservationIds, reason: "not_configured" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const replyTo = process.env.RSVP_REPLY_TO;
  const sentIds = [];
  const failedIds = [];
  const batchSize = 100;

  for (let index = 0; index < reservations.length; index += batchSize) {
    const batch = reservations.slice(index, index + batchSize);
    const messages = batch.map((reservation) => ({
      from: process.env.RESEND_FROM,
      to: reservation.email,
      ...(replyTo ? { replyTo } : {}),
      ...buildWeddingReminderEmail(reservation),
    }));
    try {
      const { error } = await resend.batch.send(messages);

      if (error) {
        console.error("Wedding reminder email batch failed:", error.message ?? error);
        failedIds.push(...batch.map((reservation) => reservation._id));
      } else {
        sentIds.push(...batch.map((reservation) => reservation._id));
      }
    } catch (error) {
      console.error("Wedding reminder email batch failed:", error);
      failedIds.push(...batch.map((reservation) => reservation._id));
    }
  }

  return { sentIds, failedIds };
}

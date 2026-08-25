import { Resend } from "resend";

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
  const attendance = reservation.isAttending
    ? `Yes, with ${reservation.companions} companion(s).`
    : "No";
  const replyTo = process.env.RSVP_REPLY_TO;

  const guest = await sendEmail(
    resend,
    {
      from: process.env.RESEND_FROM,
      to: reservation.email,
      ...(replyTo ? { replyTo } : {}),
      subject: "We received your wedding RSVP",
      text: [
        `Hi ${reservation.name},`,
        "",
        "Thank you. Your wedding RSVP has been successfully submitted.",
        `Attending: ${attendance}`,
        `Companion names: ${reservation.companionNames.join(", ") || "None"}`,
        "",
        "If you have any concerns or need to make changes, please message the bride or groom directly.",
        "",
        "With love,",
        "Kiko and Lec",
      ].join("\n"),
    },
    "Guest RSVP confirmation email",
  );

  let admin = { sent: false, reason: "not_configured" };
  if (process.env.RSVP_NOTIFICATION_EMAIL) {
    admin = await sendEmail(
      resend,
      {
        from: process.env.RESEND_FROM,
        to: process.env.RSVP_NOTIFICATION_EMAIL,
        ...(replyTo ? { replyTo } : {}),
        subject: `New wedding RSVP from ${reservation.name}`,
        text: [
          "A wedding RSVP was submitted.",
          "",
          `Name: ${reservation.name}`,
          `Guest email: ${reservation.email}`,
          `Attending: ${attendance}`,
          `Companion names: ${reservation.companionNames.join(", ") || "None"}`,
          `Notes: ${reservation.notes || "None"}`,
          "",
          "The complete response is stored in the RSVP database.",
        ].join("\n"),
      },
      "Admin RSVP notification email",
    );
  }

  return { guest, admin };
}

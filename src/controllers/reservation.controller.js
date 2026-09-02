import { Reservation } from "../models/reservation.model.js";
import { RSVP_ALREADY_SUBMITTED_MESSAGE } from "../constants/messages.js";
import {
  sendRsvpEmails,
  sendWeddingReminderEmails,
} from "../services/email.service.js";
import { validateReservationInput } from "../utils/reservation-validation.js";

function csvCell(value) {
  const text = Array.isArray(value) ? value.join("; ") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function reservationsToCsv(reservations) {
  const headings = [
    "Invitation name",
    "Invitation role",
    "Reserved seats",
    "RSVP name",
    "Email",
    "Attending",
    "Companions",
    "Companion names",
    "Notes",
    "Reminder sent at",
    "Submitted at",
  ];

  const rows = reservations.map((reservation) => [
    reservation.user?.name,
    reservation.user?.invitationRoles?.length
      ? reservation.user.invitationRoles
          .map((assignment) => `${assignment.name}: ${assignment.roles.join(" + ")}`)
          .join("; ")
      : reservation.user?.invitationRole ?? "guest",
    reservation.user?.reservedSeats,
    reservation.name,
    reservation.email,
    reservation.isAttending ? "Yes" : "No",
    reservation.companions,
    reservation.companionNames,
    reservation.notes,
    reservation.reminderSentAt?.toISOString(),
    reservation.updatedAt?.toISOString(),
  ]);

  return [headings, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
}

export async function submitReservation(req, res, next) {
  try {
    const existingReservation = await Reservation.exists({
      user: req.invitedUser._id,
    });

    if (existingReservation) {
      return res.status(409).json({
        message: RSVP_ALREADY_SUBMITTED_MESSAGE,
      });
    }

    const validation = validateReservationInput(
      req.body ?? {},
      req.invitedUser.reservedSeats,
    );

    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const reservation = await Reservation.create({
      user: req.invitedUser._id,
      ...validation.value,
    });

    let email = {
      guest: { sent: false },
      admin: { sent: false },
    };
    try {
      email = await sendRsvpEmails(reservation);
    } catch (error) {
      // The RSVP is already safely stored; an email outage must not lose it.
      console.error("RSVP email processing failed:", error);
    }

    res.status(200).json({
      message: "RSVP saved successfully.",
      reservation,
      guestConfirmationEmailSent: email.guest.sent,
      adminNotificationEmailSent: email.admin.sent,
    });
  } catch (error) {
    // The unique user index closes the race between the existence check and insert.
    if (error?.code === 11000) {
      return res.status(409).json({
        message: RSVP_ALREADY_SUBMITTED_MESSAGE,
      });
    }

    next(error);
  }
}

export async function getReservations(req, res, next) {
  try {
    const reservations = await Reservation.find()
      .populate(
        "user",
        "name reservedSeats role invitationRole invitationRoles",
      )
      .sort({ updatedAt: -1 });

    if (req.query.format === "csv") {
      res.set({
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="wedding-rsvps.csv"',
      });
      return res.send(`\uFEFF${reservationsToCsv(reservations)}`);
    }

    const attending = reservations.filter((item) => item.isAttending);
    const summary = {
      responses: reservations.length,
      attendingInvitations: attending.length,
      decliningInvitations: reservations.length - attending.length,
      totalAttendingGuests: attending.reduce(
        (total, item) => total + 1 + item.companions,
        0,
      ),
      remindersSent: attending.filter((item) => item.reminderSentAt).length,
      remindersPending: attending.filter((item) => !item.reminderSentAt).length,
    };

    res.json({ summary, reservations });
  } catch (error) {
    next(error);
  }
}

export async function sendWeddingReminders(req, res, next) {
  try {
    const attendingCount = await Reservation.countDocuments({
      isAttending: true,
    });
    const reservations = await Reservation.find({
      isAttending: true,
      reminderSentAt: null,
    }).populate(
      "user",
      "name invitationRole invitationRoles",
    );

    if (reservations.length === 0) {
      return res.json({
        message:
          attendingCount === 0
            ? "There are no attending guests to remind yet."
            : "All attending guests have already received the wedding reminder.",
        eligible: attendingCount,
        alreadySent: attendingCount,
        sent: 0,
        failed: 0,
      });
    }

    const emailResult = await sendWeddingReminderEmails(reservations);
    const reminderSentAt = new Date();

    if (emailResult.sentIds.length) {
      await Reservation.updateMany(
        {
          _id: { $in: emailResult.sentIds },
          reminderSentAt: null,
        },
        { $set: { reminderSentAt } },
      );
    }

    const sent = emailResult.sentIds.length;
    const failed = emailResult.failedIds.length;

    res.json({
      message: failed
        ? `${sent} reminder${sent === 1 ? " was" : "s were"} sent. ${failed} could not be sent and can be retried.`
        : `${sent} wedding reminder${sent === 1 ? " was" : "s were"} sent successfully.`,
      eligible: attendingCount,
      alreadySent: attendingCount - reservations.length,
      sent,
      failed,
    });
  } catch (error) {
    next(error);
  }
}

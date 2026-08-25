import { Reservation } from "../models/reservation.model.js";
import { RSVP_ALREADY_SUBMITTED_MESSAGE } from "../constants/messages.js";
import { sendRsvpEmails } from "../services/email.service.js";
import { validateReservationInput } from "../utils/reservation-validation.js";

function csvCell(value) {
  const text = Array.isArray(value) ? value.join("; ") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function reservationsToCsv(reservations) {
  const headings = [
    "Invitation name",
    "Reserved seats",
    "RSVP name",
    "Email",
    "Attending",
    "Companions",
    "Companion names",
    "Notes",
    "Submitted at",
  ];

  const rows = reservations.map((reservation) => [
    reservation.user?.name,
    reservation.user?.reservedSeats,
    reservation.name,
    reservation.email,
    reservation.isAttending ? "Yes" : "No",
    reservation.companions,
    reservation.companionNames,
    reservation.notes,
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
      .populate("user", "name reservedSeats role")
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
    };

    res.json({ summary, reservations });
  } catch (error) {
    next(error);
  }
}

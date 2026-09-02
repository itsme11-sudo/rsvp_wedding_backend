import { normalizeInvitationRole } from "../constants/invitation-roles.js";
import { User } from "../models/user.model.js";
import { Reservation } from "../models/reservation.model.js";
import { hashCode, normalizeCode } from "../utils/code.js";

export async function createInvitedUser(req, res, next) {
  try {
    const invitationCode = normalizeCode(req.body?.invitationCode);
    const name = String(req.body?.name ?? "").trim();
    const reservedSeats = Number(req.body?.reservedSeats);
    const invitationRole = normalizeInvitationRole(
      req.body?.invitationRole ?? "guest",
    );

    if (!invitationCode || invitationCode.length > 150) {
      return res.status(400).json({
        message: "Invitation code is required and must be 150 characters or fewer.",
      });
    }

    if (!name || name.length > 150) {
      return res.status(400).json({
        message: "Guest name is required and must be 150 characters or fewer.",
      });
    }

    if (
      !Number.isInteger(reservedSeats) ||
      reservedSeats < 1 ||
      reservedSeats > 20
    ) {
      return res.status(400).json({
        message: "Reserved seats must be a whole number between 1 and 20.",
      });
    }

    if (!invitationRole) {
      return res.status(400).json({ message: "Invitation role is invalid." });
    }

    const codeHash = hashCode(invitationCode);
    if (await User.exists({ codeHash })) {
      return res.status(409).json({
        message: "That invitation code is already in use. Please choose another code.",
      });
    }

    const user = await User.create({
      codeHash,
      name,
      reservedSeats,
      role: "invited",
      invitationRole,
      invitationRoles:
        invitationRole === "guest"
          ? []
          : [{ name, roles: [invitationRole] }],
    });

    res.status(201).json({
      message: `Invitation account created for ${user.name}.`,
      user: {
        id: user.id,
        name: user.name,
        reservedSeats: user.reservedSeats,
        role: user.role,
        invitationRole: user.invitationRole,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "That invitation code is already in use. Please choose another code.",
      });
    }

    next(error);
  }
}

export async function validateUserCode(req, res, next) {
  try {
    const code = normalizeCode(req.body?.code);

    if (!code) {
      return res.status(400).json({ message: "Invitation code is required." });
    }

    const user = await User.findOne({ codeHash: hashCode(code) }).select(
      "name reservedSeats role invitationRole invitationRoles",
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid invitation code." });
    }

    const submittedReservation = await Reservation.findOne({
      user: user._id,
    }).select("isAttending");
    const hasSubmittedRsvp = Boolean(submittedReservation);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        reservedSeats: user.reservedSeats,
        role: user.role,
        invitationRole: user.invitationRole ?? "guest",
        invitationRoles: user.invitationRoles ?? [],
        hasSubmittedRsvp,
        submittedRsvpIsAttending:
          submittedReservation?.isAttending ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
}

import { User } from "../models/user.model.js";
import { Reservation } from "../models/reservation.model.js";
import { hashCode, normalizeCode } from "../utils/code.js";

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

    const hasSubmittedRsvp = Boolean(
      await Reservation.exists({ user: user._id }),
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        reservedSeats: user.reservedSeats,
        role: user.role,
        invitationRole: user.invitationRole ?? "guest",
        invitationRoles: user.invitationRoles ?? [],
        hasSubmittedRsvp,
      },
    });
  } catch (error) {
    next(error);
  }
}

import { User } from "../models/user.model.js";
import { hashCode, normalizeCode } from "../utils/code.js";

export async function requireInvitationCode(req, res, next) {
  try {
    const code = req.get("x-invitation-code") ?? req.body?.code;

    if (!normalizeCode(code)) {
      return res.status(401).json({ message: "Invitation code is required." });
    }

    const user = await User.findOne({ codeHash: hashCode(code) });

    if (!user) {
      return res.status(401).json({ message: "Invalid invitation code." });
    }

    req.invitedUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (req.invitedUser?.role !== "admin") {
    return res.status(403).json({ message: "Admin access is required." });
  }

  next();
}

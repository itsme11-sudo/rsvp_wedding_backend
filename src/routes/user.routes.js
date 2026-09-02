import { Router } from "express";
import {
  createInvitedUser,
  validateUserCode,
} from "../controllers/user.controller.js";
import {
  requireAdmin,
  requireInvitationCode,
} from "../middleware/invitation-auth.js";

export const userRouter = Router();

userRouter.post("/validate", validateUserCode);
userRouter.post(
  "/",
  requireInvitationCode,
  requireAdmin,
  createInvitedUser,
);

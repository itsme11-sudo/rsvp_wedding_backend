import { Router } from "express";
import {
  getReservations,
  submitReservation,
  sendWeddingReminders,
} from "../controllers/reservation.controller.js";
import {
  requireAdmin,
  requireInvitationCode,
} from "../middleware/invitation-auth.js";

export const reservationRouter = Router();

reservationRouter.post("/", requireInvitationCode, submitReservation);
reservationRouter.post(
  "/reminders",
  requireInvitationCode,
  requireAdmin,
  sendWeddingReminders,
);
reservationRouter.get("/", requireInvitationCode, requireAdmin, getReservations);

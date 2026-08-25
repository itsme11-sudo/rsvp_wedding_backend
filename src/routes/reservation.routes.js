import { Router } from "express";
import {
  getReservations,
  submitReservation,
} from "../controllers/reservation.controller.js";
import {
  requireAdmin,
  requireInvitationCode,
} from "../middleware/invitation-auth.js";

export const reservationRouter = Router();

reservationRouter.post("/", requireInvitationCode, submitReservation);
reservationRouter.get("/", requireInvitationCode, requireAdmin, getReservations);

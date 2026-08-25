import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { reservationRouter } from "./routes/reservation.routes.js";
import { userRouter } from "./routes/user.routes.js";

export function createApp() {
  const app = express();
  const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim());

  app.disable("x-powered-by");
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json({ limit: "20kb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { message: "Too many requests. Please try again later." },
    }),
  );

  app.get("/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/users", userRouter);
  app.use("/api/reservations", reservationRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

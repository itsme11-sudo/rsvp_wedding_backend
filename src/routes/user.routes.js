import { Router } from "express";
import { validateUserCode } from "../controllers/user.controller.js";

export const userRouter = Router();

userRouter.post("/validate", validateUserCode);

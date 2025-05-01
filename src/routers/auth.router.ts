/** @format */

import { authController } from "../controllers";
import { Router } from "express";
import { requireAdmin } from "../middlewares";

export const authRouter = Router();

authRouter.post("/signup", requireAdmin, authController.signUp);
authRouter.post("/signin", authController.signIn);

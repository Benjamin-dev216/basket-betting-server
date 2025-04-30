/** @format */

import express from "express";
import { authRouter } from "./auth.router";
import { userRouter } from "./user.router";
import { betRouter } from "./bet.router";
import { historyRouter } from "./history.router";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/bet", betRouter);
router.use("/history", historyRouter);

export default router;

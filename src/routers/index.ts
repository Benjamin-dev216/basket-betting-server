/** @format */

import express from "express";
import { authRouter } from "./auth.router";
import { balanceRouter } from "./balance.router";
import { betRouter } from "./bet.router";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/balance", balanceRouter);
router.use("/bet", betRouter);

export default router;

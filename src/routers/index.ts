/** @format */

import express from "express";
import { authRouter } from "./auth.router";
import { balanceRouter } from "./balance.router";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/balance", balanceRouter);

export default router;

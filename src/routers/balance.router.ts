/** @format */

import { balanceController } from "@/controllers";
import { Router } from "express";
import { requireAdmin } from "@/middlewares";

export const balanceRouter = Router();

balanceRouter.patch("/add", requireAdmin, balanceController.addBalanceToUser);

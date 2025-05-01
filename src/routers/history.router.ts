import { historyController } from "../controllers";
import { Router } from "express";
import { requireAuth } from "../middlewares";

export const historyRouter = Router();

historyRouter.get("/", requireAuth, historyController.fetchHistory);

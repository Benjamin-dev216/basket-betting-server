import { betController } from "@/controllers";
import { Router } from "express";

export const betRouter = Router();

betRouter.post("/", betController.placeBet);

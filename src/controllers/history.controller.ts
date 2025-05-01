/** @format */

import { Request, Response } from "express";
import "dotenv/config";
import { AppDataSource } from "@/setup/datasource";
import jwt from "jsonwebtoken";
import { authService } from "@/services";
import { UserEntity, BetEntity } from "@/entities";
import { errorHandlerWrapper } from "@/utils";

const fetchHistoryController = async (req: Request, res: Response) => {
  try {
    const token = req.header("Authorization")
      ? req.header("Authorization").replace("Bearer ", "")
      : null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const rlt = await authService.getUser({ email: decoded.email });

    const userId = rlt.id; // from auth middleware
    const userRepository = AppDataSource.getRepository(UserEntity);
    const betRepository = AppDataSource.getRepository(BetEntity);
    if (rlt.role === "user") {
      const userBets = await userRepository.findOne({
        where: { id: userId },
        relations: ["bets"],
      });
      res.status(201).json({ bets: userBets?.bets || [] });
    } else {
      const bets = await betRepository.find();
      res.status(201).json({ bets: bets || [] });
    }
  } catch (err) {
    console.error("Reaching User History:", err);
    res.status(500).json({ error: "Internal error" });
  }
};

export const fetchHistory = errorHandlerWrapper(fetchHistoryController);

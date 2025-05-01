/** @format */

import { Request, Response } from "express";
import "dotenv/config";
import { AppDataSource } from "../setup/datasource";
import jwt from "jsonwebtoken";
import { authService } from "../services";
import { UserEntity, BetEntity } from "../entities";
import { errorHandlerWrapper } from "../utils";

const placeBetController = async (req: Request, res: Response) => {
  try {
    const { marketId, handicap, outcomeName, odds, amount, matchId } = req.body;
    const token = req.header("Authorization")
      ? req.header("Authorization").replace("Bearer ", "")
      : null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const rlt = await authService.getUser({ email: decoded.email });

    const userId = rlt.id; // from auth middleware
    const userRepo = AppDataSource.getRepository(UserEntity);
    const betRepo = AppDataSource.getRepository(BetEntity);
    const user = await userRepo.findOneByOrFail({ id: userId });

    if (Number(user.balance) < Number(amount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const bet = betRepo.create({
      user,
      matchId,
      marketId,
      handicap,
      outcomeName,
      odds,
      amount,
      status: "open",
    });

    await betRepo.save(bet);

    user.balance = Number(user.balance) - Number(amount);
    await userRepo.save(user);

    res.status(201).json({ success: true, bet });
  } catch (err) {
    console.error("Bet placement error:", err);
    res.status(500).json({ error: "Internal error" });
  }
};

export const placeBet = errorHandlerWrapper(placeBetController);

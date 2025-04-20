/** @format */

import { authService, userService } from "@/services";
import { Request, Response } from "express";
import "dotenv/config";
import { errorHandlerWrapper } from "@/utils";

const addBalance = async (req: Request, res: Response) => {
  try {
    const { email, amount } = req.body;

    if (!email || typeof amount !== "number") {
      return res.status(400).json({ message: "Invalid input data" });
    }

    const user = await userService.findByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const updatedUser = await userService.addUserBalance(email, amount);

    return res.status(200).json({
      message: "Balance updated successfully",
      newBalance: updatedUser.balance,
    });
  } catch (error) {
    console.error("Error updating balance:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addBalanceToUser = errorHandlerWrapper(addBalance);

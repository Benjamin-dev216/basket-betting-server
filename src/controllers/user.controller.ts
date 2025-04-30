/** @format */

import { authService, userService } from "@/services";
import { Request, response, Response } from "express";
import jwt from "jsonwebtoken";
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

const fetchAllUsersController = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.status(201).send(users);
  } catch (error) {
    res.status(500).json("User loading failed");
    throw new Error("Internal server error");
  }
};

const fetchUserController = async (req: Request, res: Response) => {
  try {
    const token = req.header("Authorization")
      ? req.header("Authorization").replace("Bearer ", "")
      : null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await authService.getUser(decoded.email);
    res.status(201).send(user);
  } catch (error) {
    res.status(500).json("User loading failed");
    throw new Error("Internal server error");
  }
};

const deleteUserController = async (req: Request, res: Response) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(202).json("Sucess");
  } catch (error) {
    res.status(500).json("Delete Failed");
  }
};

const updateUserController = async (req: Request, res: Response) => {
  try {
    await userService.updateUser(req.params.id, req.body);
    res.status(201).json("Sucess");
  } catch (error) {
    res.status(500).json("Delete Failed");
  }
};

export const addBalanceToUser = errorHandlerWrapper(addBalance);
export const fetchAllUsers = errorHandlerWrapper(fetchAllUsersController);
export const fetchUser = errorHandlerWrapper(fetchUserController);
export const deleteUser = errorHandlerWrapper(deleteUserController);
export const updateUser = errorHandlerWrapper(updateUserController);

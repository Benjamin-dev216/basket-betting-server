/** @format */

import { authController, userController } from "@/controllers";
import { Router } from "express";
import { requireAdmin } from "@/middlewares";

export const userRouter = Router();

userRouter.patch("/balance", requireAdmin, userController.addBalanceToUser);
userRouter.get("/all", requireAdmin, userController.fetchAllUsers);
userRouter.get("/", requireAdmin, userController.fetchUser);
userRouter.delete("/:id", requireAdmin, userController.deleteUser);
userRouter.post("/", requireAdmin, authController.signUp);
userRouter.put("/:id", requireAdmin, userController.updateUser);

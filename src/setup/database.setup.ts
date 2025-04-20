/** @format */

import { UserEntity } from "@/entities";
import { AppDataSource } from "./datasource";
import bcrypt from "bcryptjs";
import { authService } from "@/services";
import { CreateUserRequestType } from "@/types";
import "dotenv/config";

export const databaseSetup = async (): Promise<void> => {

  await AppDataSource.initialize();

  // Adding admin user when the database setup
  const userRepository = AppDataSource.getRepository(UserEntity);

  const userCount: number = await userRepository.count();

  if (userCount === 0) {
    const adminHashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD,
      10
    );

    const adminUser: CreateUserRequestType = {
      name: process.env.ADMIN_NAME,
      hashedPassword: adminHashedPassword,
      role: "admin",
    };

    authService.createUser(adminUser);
  }
};

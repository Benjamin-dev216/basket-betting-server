/** @format */

import { DataSource } from "typeorm";
import { UserEntity, BetEntity } from "../entities";
import "dotenv/config";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DB_HOST,
  ssl: {
    rejectUnauthorized: false, // Needed for Render and other managed DBs
  },
  entities: [UserEntity, BetEntity],
  logging: false,
  synchronize: true,
});

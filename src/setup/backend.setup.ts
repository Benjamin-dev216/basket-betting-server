/** @format */

import express, { Express, Request, Response } from "express";
import cors from "cors";
import router from "../routers";
import { Logger } from "../utils";
import http from "http";
import { errorHandlerMiddleware } from "../middlewares";
import { startGoalServeWS } from "../services/goal.ws.service";
import { startRelayServer } from "../services/relay.ws.service";

export const backendSetup = () => {
  const app: Express = express();
  const server = http.createServer(app); // <-- needed for WS

  app.use(cors());
  app.use(express.json());
  // app.use(clientUse());
  app.get("/health", (req: Request, res: Response) => {
    res.send("It's healthy!");
  });
  app.use("/api", router);
  app.use(errorHandlerMiddleware);

  startGoalServeWS().catch((err) => {
    console.error("❌ Failed to start GoalServe WS:", err);
  });

  startRelayServer(server);

  const port = process.env.PORT || 8000;
  server.listen(port, () => {
    Logger.info(`🚀 Server running on port ${port}`);
  });
};

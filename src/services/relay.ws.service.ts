import { WebSocketServer, WebSocket } from "ws";
import { createClient } from "redis";
import { IncomingMessage } from "http";
import type { Server } from "http";

const REDIS_CHANNEL = "goalserve:basketball";

// Define the structure for a client (connected user)
interface SubscribedClient {
  socket: WebSocket;
  matchId: string | null;
}

const clients = new Set<SubscribedClient>();

export const startRelayServer = async (server: Server) => {
  // Redis client to subscribe to updates
  const redisSub = createClient();
  const redisGetClient = createClient();

  // Connect to Redis and handle errors
  redisSub.on("error", (err) => {
    console.error("[Redis] Error:", err);
  });

  try {
    await redisSub.connect();
    await redisGetClient.connect();
    console.log("[Redis] Subscribed ✅");
  } catch (err) {
    console.error("[Redis] Failed to connect:", err);
    return;
  }

  const wss = new WebSocketServer({ noServer: true });

  // Handle WebSocket upgrade requests
  server.on("upgrade", (req: IncomingMessage, socket, head) => {
    if (req.url === "/live") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      socket.destroy(); // Reject connections that are not for /live
    }
  });

  // Handle new WebSocket client connections
  wss.on("connection", (ws: WebSocket) => {
    const client: SubscribedClient = { socket: ws, matchId: null };
    clients.add(client);
    console.log("[RelayWS] Client connected");

    // Handle messages from the client (e.g., subscription to a match)
    ws.on("message", async (msg: Buffer) => {
      try {
        const data = JSON.parse(msg.toString());

        if (data.type === "getMatchList") {
          try {
            const cached = await redisGetClient.get("latest:matchList");
            if (cached && client.socket.readyState === WebSocket.OPEN) {
              client.socket.send(cached); // Already stringified
            }
          } catch (err) {
            console.error("[RelayWS] Failed to fetch matchList:", err);
          }
        }

        // Handle subscription to a match
        if (data.type === "subscribe" && data.matchId) {
          client.matchId = data.matchId;
          console.log(`[RelayWS] Subscribed to match: ${data.matchId}`);
        }
      } catch (err) {
        console.warn("[RelayWS] Invalid message from client:", err);
      }
    });

    // Clean up when client disconnects
    ws.on("close", () => {
      console.log("[RelayWS] Client disconnected");
      clients.delete(client);
    });

    // Handle errors from WebSocket
    ws.on("error", (err) => {
      console.error("[RelayWS] Client error:", err);
      clients.delete(client);
      ws.close();
    });
  });

  // Redis subscription to basketball data
  await redisSub.subscribe(REDIS_CHANNEL, (message: string) => {
    try {
      const parsed = JSON.parse(message);

      const { matchId, odds, stp, statsParsed, stats, ...rest } = parsed;

      // const matchInfoPayload = JSON.stringify({
      //   type: "matchInfo",
      //   matchId,
      //   odds,
      //   ...rest,
      // });

      // Handling live matches broadcast
      if (parsed.type === "matchList") {
        const matchListPayload = JSON.stringify(parsed);
        for (const client of clients) {
          // if (client.matchId === matchId) continue;
          client.socket.send(matchListPayload);
        }
        return;
      }

      // Distribute match information to all connected clients
      for (const client of clients) {
        if (client.socket.readyState !== WebSocket.OPEN) continue;

        // Send match info to everyone
        // client.socket.send(oddsPayload);

        // Send odds only to subscribers of that match
        // console.log(matchId, client.matchId, odds);
        // console.log(client.matchId, client.matchId === matchId);

        if (client.matchId === matchId && odds) {
          const oddsPayload = JSON.stringify({
            type: "odds",
            matchId,
            odds,
            stp,
            statsParsed,
            stats,
          });
          client.socket.send(oddsPayload);
        }
      }
    } catch (err) {
      console.error("[RelayWS] Failed to handle message:", err);
    }
  });

  console.log("[RelayWS] Relay running on /live ✅");
};

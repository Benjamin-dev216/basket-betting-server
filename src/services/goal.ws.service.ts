import WebSocket from "ws";
import axios from "axios";
import { createClient } from "redis";
import dotenv from "dotenv";
import { getFinishedSegmentByStateCode, settleBets } from "./settleBets";

dotenv.config();

import { setTimeout as wait } from "timers/promises";

// globally cache token and timestamp
let cachedToken: string | null = null;
let tokenFetchedAt = 0;

const REDIS_CHANNEL = "goalserve:basketball";
const REDIS_TTL = 10;
const SPORT_TYPE = "basket"; // use 'basket' per API spec

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
redisClient.on("error", (err) => console.error("[Redis] Error:", err));

const API_KEY = process.env.GOALSERVE_KEY!;
const TOKEN_URL = "http://152.89.28.69:8765/api/v1/auth/gettoken";

interface AVLMessage {
  mt: "avl";
  sp: string;
  evts: any[];
}

interface UPDTMessage {
  mt: "updt";
  sp: string;
  id: number;
  uptd: string;
  pt: number;
  t1: { name?: string; n?: string; kit?: { si?: string | null } };
  t2: { name?: string; n?: string; kit?: { si?: string | null } };
  odds: any[];
  stats: Record<string, any>;
  [key: string]: any;
}

type IncomingMessage = AVLMessage | UPDTMessage;

function normalizeUpdate(msg: UPDTMessage) {
  return {
    matchId: msg.id,
    sport: msg.sp,
    updated: msg.uptd,
    teams: {
      home: msg.t1.name || msg.t1.n,
      away: msg.t2.name || msg.t2.n,
    },
    odds: msg.odds,
    stats: msg.stats,
    raw: msg,
  };
}

function getTeam(teamData: any) {
  return {
    name: teamData.n || teamData.name || "Unknown",
    kitColors: teamData.kit?.si ? teamData.kit.si.split(",") : null,
  };
}

function parseGoalServeUpdate(data: UPDTMessage) {
  function formatStats(statStr: string | undefined) {
    if (!statStr) return null;
    const segments = statStr.split("|").filter(Boolean);
    const stats: Record<string, string> = {};
    for (const seg of segments) {
      const [key, value] = seg.split("=");
      if (key && value) stats[key.trim()] = value.trim();
    }
    return stats;
  }

  let matchScore = data.sc ? data.sc : null;

  return {
    matchId: data.id,
    sport: data.sp,
    updated: data.uptd,
    competition: {
      id: data.cmp_id || null,
      name: data.cmp_name || null,
    },
    teams: {
      home: getTeam(data.t1),
      away: getTeam(data.t2),
    },
    stp: data.stp,
    stats: data.stats,
    cms: data.cms
      ? data.cms.map((e: any) => ({
          eventId: e.id,
          minute: Math.floor(e.tm / 60),
          description: e.n.trim(),
        }))
      : [],
    statsRaw: data.stat || null,
    statsParsed: data.stat ? formatStats(data.stat) : null,
    odds: data.odds
      ? data.odds.map((o: any) => ({
          marketId: o.id,
          handicap: o.ha ?? null,
          outcomes: o.o.map((outcome: any) => ({
            name: outcome.n,
            value: outcome.v,
            liveValue: outcome.lv ?? null,
          })),
        }))
      : [],
    raw: data,
  };
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // reuse token for 50 mins
  if (cachedToken && now - tokenFetchedAt < 50 * 60 * 1000) {
    return cachedToken;
  }

  const LOCK_KEY = "token:lock";
  const TOKEN_KEY = "token:value";

  const gotLock = await redisClient.set(LOCK_KEY, "1", { NX: true, EX: 10 });
  if (!gotLock) {
    console.log("[Token] Waiting for another instance to fetch token...");
    for (let i = 0; i < 10; i++) {
      const token = await redisClient.get(TOKEN_KEY);
      if (token) return token;
      await wait(1000);
    }
    throw new Error("Timeout waiting for token from other instance");
  }

  try {
    const response = await axios.post(
      TOKEN_URL,
      { apiKey: API_KEY },
      { headers: { "Content-Type": "application/json" } }
    );

    cachedToken = response.data.token;
    tokenFetchedAt = Date.now();

    await redisClient.set(TOKEN_KEY, cachedToken, { EX: 3600 });
    return cachedToken;
  } catch (err) {
    throw new Error("Failed to fetch token: " + (err as Error).message);
  } finally {
    await redisClient.del(LOCK_KEY);
  }
}

let currentWS: WebSocket | null = null;

export async function startGoalServeWS() {
  if (!redisClient.isOpen) await redisClient.connect();

  try {
    const token = await getAccessToken();
    const wsUrl = `ws://152.89.28.69:8765/ws/${SPORT_TYPE}?tkn=${token}`;
    const ws = new WebSocket(wsUrl);
    currentWS = ws;

    // ws.on("open", () => console.log("[GoalServeWS] Connected ✅"));

    ws.on("message", async (data: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(data.toString()) as IncomingMessage;

        if (msg.sp !== SPORT_TYPE) return;

        if (msg.mt === "updt") {
          let normalized;
          try {
            normalized = parseGoalServeUpdate(msg);
          } catch (err) {
            console.error(
              "[GoalServeWS] parseGoalServeUpdate failed, falling back to normalizeUpdate:",
              (err as Error).message
            );
            normalized = normalizeUpdate(msg);
          }
          let sc = Number(msg.sc);
          if (sc === 1082 || sc === 1083 || sc === 1084) {
            const finishedSegment = getFinishedSegmentByStateCode(
              sc,
              Number(msg.pc)
            );
            if (finishedSegment) {
              await settleBets(normalized, finishedSegment);
            }
          }
          await redisClient.publish(REDIS_CHANNEL, JSON.stringify(normalized));
          // await redisClient.set(
          //   `match:${normalized.matchId}`,
          //   JSON.stringify(normalized),
          //   { EX: REDIS_TTL }
          // );
        }

        if (msg.mt === "avl") {
          const matchList = msg.evts.map((match) => {
            return {
              eventId: match.id,
              matchId: match.id,
              competition: match.cmp_name,
              teams: {
                home: getTeam(match.t1),
                away: getTeam(match.t2),
              },
              pc: match.pc,
            };
          });

          const payload = JSON.stringify({
            type: "matchList",
            sport: msg.sp,
            matches: matchList,
          });

          await redisClient.publish(REDIS_CHANNEL, payload);

          // await redisClient.set("latest:matchList", payload, { EX: 20 }); // expires in 10s

          // // console.log(
          //   `[GoalServeWS] Sent ${matchList.length} matches to channel`
          // );
        }
      } catch (err) {
        console.error(
          "[GoalServeWS] JSON Parse Error:",
          (err as Error).message
        );
      }
    });

    ws.on("close", () => {
      console.warn("[GoalServeWS] Disconnected. Reconnecting in 3s...");
      setTimeout(startGoalServeWS, 3000);
    });

    ws.on("error", (err) => {
      console.error("[GoalServeWS] WebSocket Error:", err);
    });
  } catch (err) {
    console.error("[GoalServeWS] Startup Error:", (err as Error).message);
    setTimeout(startGoalServeWS, 5000);
  }
}

// ✅ Hourly token refresh and reconnection
setInterval(async () => {
  try {
    console.log("[GoalServeWS] Refreshing token + reconnecting...");
    if (currentWS && currentWS.readyState === WebSocket.OPEN) {
      currentWS.close(); // triggers your reconnect logic
    } else {
      await startGoalServeWS(); // in case it's already closed
    }
  } catch (err) {
    console.error("[GoalServeWS] Token refresh/connect failed:", err);
  }
}, 60 * 60 * 1000); // 1 hour

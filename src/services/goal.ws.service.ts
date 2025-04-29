import WebSocket from "ws";
import axios from "axios";
import { createClient } from "redis";
import dotenv from "dotenv";
import { getFinishedSegmentByStateCode, settleBets } from "./settleBets";

dotenv.config();

const REDIS_CHANNEL = "goalserve:basketball";
const REDIS_TTL = 10;
const SPORT_TYPE = "basket"; // use 'basket' per API spec

const redisClient = createClient();
redisClient.on("error", (err) => console.error("[Redis] Error:", err));

const API_KEY = process.env.GOALSERVE_KEY!;
const TOKEN_URL = "http://85.217.222.218:8765/api/v1/auth/gettoken";

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
  // additional optional fields (competition, mid, cms, stat, cmp_id, cmp_name, etc.)
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

/**
 * New parser that enriches and normalizes the "updt" message.
 */
function getTeam(teamData: any) {
  return {
    name: teamData.n || teamData.name || "Unknown",
    kitColors: teamData.kit?.si ? teamData.kit.si.split(",") : null,
  };
}
function parseGoalServeUpdate(data: UPDTMessage) {
  // Helper to extract team data

  // Helper to parse the stat string into key-value pairs
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

  // Extract a score from the `sc` field if available;
  // otherwise you can leave it as a raw string or perform additional parsing.
  let matchScore = data.sc ? data.sc : null;

  return {
    // Use mid if available; otherwise fallback to id.
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
    // If available, map the list of match events (cms)
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
  const response = await axios.post(
    TOKEN_URL,
    { apiKey: API_KEY },
    {
      headers: { "Content-Type": "application/json" },
    }
  );
  return response.data.token;
}

export async function startGoalServeWS() {
  if (!redisClient.isOpen) await redisClient.connect();

  try {
    const token = await getAccessToken();
    const wsUrl = `ws://85.217.222.218:8765/ws/${SPORT_TYPE}?tkn=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.on("open", () => console.log("[GoalServeWS] Connected ✅"));

    ws.on("message", async (data: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(data.toString()) as IncomingMessage;

        if (msg.sp !== SPORT_TYPE) return;

        if (msg.mt === "updt") {
          // Try to enrich the update using the new parser.
          // (If it fails, fallback to the simple normalizer.)
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

          await redisClient.publish(REDIS_CHANNEL, JSON.stringify(normalized));
          await redisClient.set(
            `match:${normalized.matchId}`,
            JSON.stringify(normalized),
            { EX: REDIS_TTL }
          );
          if (msg.sc === 1082 || msg.sc === 1083 || msg.sc === 1084) {
            const finishedSegment = getFinishedSegmentByStateCode(
              msg.sc,
              msg.pc
            );
            if (finishedSegment) {
              await settleBets(normalized, finishedSegment);
            }
          }
        }

        // Handle available events ("avl") as before.
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

          await redisClient.set("latest:matchList", payload, { EX: 20 }); // expires in 10s

          console.log(
            `[GoalServeWS] Sent ${matchList.length} matches to channel`
          );
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

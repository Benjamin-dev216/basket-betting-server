// src/services/settleBets.ts
import { AppDataSource } from "@/setup/datasource";
import { UserEntity, BetEntity } from "@/entities";
import { evaluateBetResult } from "@/utils/ruleExecutor";
import { parseSegmentPoints } from "@/utils/parseSegmentPoints";

export const settleBets = async (match: any, finishedSegment: string) => {
  const betRepo = AppDataSource.getRepository(BetEntity);
  const userRepo = AppDataSource.getRepository(UserEntity);

  const openBets = await betRepo.find({
    where: { matchId: match.id, status: "open" },
    relations: ["user"],
  });

  const stats = { segmentPoints: parseSegmentPoints(match.stats) };

  for (const bet of openBets) {
    const segment = getMarketSegment(bet.marketId);
    if (segment !== finishedSegment) continue; // skip unrelated bets

    const bettemp = {
      marketId: bet.marketId,
      outcomeName: bet.outcomeName,
      handicap: bet.handicap,
      odds: bet.odds,
      amount: bet.amount,
    };

    const isWin = evaluateBetResult(bettemp, stats);

    bet.status = "settled";
    bet.result = isWin ? "win" : "loss";
    await betRepo.save(bet);

    if (isWin) {
      const winnings = Number(bet.amount) * Number(bet.odds);
      bet.user.balance = Number(bet.user.balance) + winnings;
      await userRepo.save(bet.user);
    }
  }
};

export const getFinishedSegmentByStateCode = (
  code: number,
  period: number
): "Q1" | "Q2" | "Q3" | "Q4" | "H1" | "H2" | "OT" | "FT" | null => {
  if (code === 1082) {
    // End of Quarter
    switch (period) {
      case 1:
        return "Q1";
      case 2:
        return "Q2";
      case 3:
        return "Q3";
      case 4:
        return "Q4";
      default:
        return null;
    }
  }

  if (code === 1083) {
    // End of Half
    switch (period) {
      case 2:
        return "H1"; // after Q2
      case 4:
        return "H2"; // after Q4
      default:
        return null;
    }
  }

  if (code === 1084) {
    // End of Match
    return "FT";
  }

  if (code === 1085 && period === 5) {
    // Over Time finished
    return "OT";
  }

  return null;
};

export function getMarketSegment(
  marketId: number | string
): "Q1" | "Q2" | "H1" | "H2" | "FT" | null {
  const id = Number(marketId);

  if ([180079, 180080, 180077, 180078, 759, 760, 5300564].includes(id))
    return "Q1";
  if ([180086, 180087].includes(id)) return "Q2";
  if ([180060, 180062, 584, 180753, 768].includes(id)) return "H1";
  if ([180069, 769, 770].includes(id)) return "H2";
  if ([2021, 2022, 1446, 1450].includes(id)) return "FT";

  return null; // fallback for unknown
}

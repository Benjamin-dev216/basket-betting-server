import { Bet, RuleType, MatchStats, MarketRule } from "../types/market.rule";
import { marketRules } from "./const";

const ruleExecutors: Record<
  RuleType,
  (bet: Bet, stats: MatchStats, rule: MarketRule) => boolean
> = {
  moneyline: (bet, stats, rule) => {
    const { home, away } = stats.segmentPoints[rule.segment];
    const winner = home > away ? "home" : away > home ? "away" : "draw";
    return bet.outcomeName.toLowerCase().includes(winner);
  },

  spread: (bet, stats, rule) => {
    const { home, away } = stats.segmentPoints[rule.segment];
    const spread = parseFloat(bet.handicap);
    if (bet.outcomeName.toLowerCase().includes("home")) {
      return home + spread > away;
    } else {
      return away + spread > home;
    }
  },

  total: (bet, stats, rule) => {
    const { home, away } = stats.segmentPoints[rule.segment];
    const total = home + away;
    const line = parseFloat(bet.handicap);
    return bet.outcomeName.toLowerCase().includes("over")
      ? total > line
      : total < line;
  },

  team_total: (bet, stats, rule) => {
    if (!rule.team) return false;
    const score = stats.segmentPoints[rule.segment][rule.team];
    const line = parseFloat(bet.handicap);
    return bet.outcomeName.toLowerCase().includes("over")
      ? score > line
      : score < line;
  },

  result_total: (bet, stats, rule) => {
    const { home, away } = stats.segmentPoints[rule.segment];
    const total = home + away;
    const line = parseFloat(bet.handicap);
    const expectedWinner = bet.outcomeName.toLowerCase().includes("home")
      ? "home"
      : bet.outcomeName.toLowerCase().includes("away")
      ? "away"
      : "draw";

    const actualWinner = home > away ? "home" : away > home ? "away" : "draw";
    if (expectedWinner !== actualWinner) return false;

    return bet.outcomeName.toLowerCase().includes("over")
      ? total > line
      : total < line;
  },
};
export function evaluateBetResult(bet: Bet, stats: MatchStats): boolean {
  const rule = marketRules[bet.marketId];
  if (!rule) return false;

  const executor = ruleExecutors[rule.type];
  return executor?.(bet, stats, rule) ?? false;
}

type Segment = "Q1" | "Q2" | "Q3" | "Q4" | "H1" | "H2" | "OT" | "FT";

interface MatchStats {
  segmentPoints: Record<Segment, { home: number; away: number }>;
}

interface Bet {
  marketId: number;
  outcomeName: string;
  handicap: string;
  odds: number;
  amount: number;
}

type RuleType =
  | "moneyline"
  | "spread"
  | "total"
  | "team_total"
  | "result_total";

interface MarketRule {
  type: RuleType;
  segment: Segment;
  team?: "home" | "away";
}

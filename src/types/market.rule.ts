export type Segment = "Q1" | "Q2" | "Q3" | "Q4" | "H1" | "H2" | "OT" | "FT";

export interface MatchStats {
  segmentPoints: Record<Segment, { home: number; away: number }>;
}

export interface Bet {
  marketId: number;
  outcomeName: string;
  handicap: string;
  odds: number;
  amount: number;
}

export type RuleType =
  | "moneyline"
  | "spread"
  | "total"
  | "team_total"
  | "result_total";

export interface MarketRule {
  type: RuleType;
  segment: Segment;
  team?: "home" | "away";
}

type Segment = "Q1" | "Q2" | "Q3" | "Q4" | "H1" | "H2" | "OT" | "FT" | "T";

export const parseSegmentPoints = (
  stats: Record<string, [number, number]>
): Record<Segment, { home: number; away: number }> => {
  const result: Partial<Record<Segment, { home: number; away: number }>> = {};

  for (const [key, value] of Object.entries(stats)) {
    if (Array.isArray(value) && value.length === 2) {
      const [home, away] = value;
      if (typeof home === "number" && typeof away === "number") {
        result[key === "T" ? ("FT" as Segment) : (key as Segment)] = {
          home,
          away,
        };
      }
    }
  }

  return result as Record<Segment, { home: number; away: number }>;
};

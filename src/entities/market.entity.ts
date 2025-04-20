import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { MatchEntity } from "./index";
import { CoreEntity } from "./core.entity";

@Entity("market")
export class MarketEntity extends CoreEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => MatchEntity, (match) => match.markets)
  match: MatchEntity;

  @Column()
  label: string; // e.g., "1st Quarter Spread", "2nd Half Total"

  @Column()
  category: "spread" | "moneyline" | "total" | "custom";

  @Column({ nullable: true }) // for spread or total
  handicap: number;

  @Column("float")
  odds: number;

  @Column()
  team: string; // team name or 'over/under'

  @Column({ default: false })
  isLive: boolean;
}

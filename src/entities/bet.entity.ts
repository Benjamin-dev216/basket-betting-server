import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { BetSlipEntity, MarketEntity } from "./index";
import { CoreEntity } from "@/entities/core.entity";
@Entity("bet")
export class BetEntity extends CoreEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => BetSlipEntity, (slip) => slip.bets)
  slip: BetSlipEntity;

  @ManyToOne(() => MarketEntity)
  market: MarketEntity;

  @Column()
  result: "pending" | "won" | "lost";
}

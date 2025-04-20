import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { CoreEntity, BetSlipEntity, MarketEntity } from "./index";

@Entity("bet")
export class BetEntity extends CoreEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => BetSlipEntity, slip => slip.bets)
  slip: BetSlipEntity;

  @ManyToOne(() => MarketEntity)
  market: MarketEntity;

  @Column()
  result: 'pending' | 'won' | 'lost';
}

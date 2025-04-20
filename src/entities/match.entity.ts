import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { CoreEntity } from "./core.entity";
import { MarketEntity } from "./market.entity";

@Entity("match")
export class MatchEntity extends CoreEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  homeTeam: string;

  @Column()
  awayTeam: string;

  @Column()
  startTime: Date;

  @OneToMany(() => MarketEntity, market => market.match)
  markets: MarketEntity[];
}

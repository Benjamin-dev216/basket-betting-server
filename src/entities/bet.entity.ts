// src/entities/Bet.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { CoreEntity } from "./core.entity";

@Entity("bet")
export class BetEntity extends CoreEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (user) => user.bets)
  user: UserEntity;

  @Column()
  matchId: string;

  @Column()
  marketId: number;

  @Column()
  handicap: string;

  @Column()
  outcomeName: string;

  @Column("decimal", { precision: 6, scale: 2 })
  odds: number;

  @Column("decimal", { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: "open" }) // open | settled
  status: string;

  @Column({ nullable: true }) // win | loss | refund
  result: string;
}

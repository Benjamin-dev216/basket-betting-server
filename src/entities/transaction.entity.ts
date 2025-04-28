import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { CoreEntity } from "./core.entity";
import { UserEntity } from "./";

export enum BetType {
  SINGLE = "SINGLE",
  PARLAY = "PARLAY",
}

export enum BetStatus {
  PENDING = "PENDING",
  WON = "WON",
  LOST = "LOST",
  CANCELLED = "CANCELLED",
}

@Entity({ name: "transaction" })
export class TransactionEntity extends CoreEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => UserEntity, { eager: true })
  user: UserEntity;

  @Column("float")
  amount: number;

  @Column({ nullable: true })
  reason: string;

  @Column({ type: "enum", enum: BetType, default: BetType.SINGLE })
  betType: BetType;

  @Column({ type: "enum", enum: BetStatus, default: BetStatus.PENDING })
  status: BetStatus;

  @Column({ nullable: true })
  matchId: string; // External bet365 ID or internal reference

  @Column({ nullable: true })
  selection: string; // Team/player selected

  @Column("float", { nullable: true })
  odds: number;

  @Column({ type: "timestamp", nullable: true })
  matchTime: Date;
}

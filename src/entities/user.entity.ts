/** @format */

import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { CoreEntity } from "../entities/core.entity";
import { BetEntity } from "./bet.entity";
@Entity("user")
export class UserEntity extends CoreEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: "user" }) // 'user' or 'admin'
  role: "user" | "admin";

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column("decimal", { precision: 10, scale: 2, default: 3 })
  pendingTime1: number;

  @Column("decimal", { precision: 10, scale: 2, default: 5 })
  pendingTime2: number;

  @OneToMany(() => BetEntity, (bet) => bet.user)
  bets: BetEntity[];
}

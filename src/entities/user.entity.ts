/** @format */

import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { CoreEntity } from "./core.entity";
import { BetSlipEntity } from "./betslip.entity";

@Entity("user")
export class UserEntity extends CoreEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'user' }) // 'user' or 'admin'
  role: 'user' | 'admin';

  @Column({ type: 'float', default: 0 })
  balance: number;

  @OneToMany(() => BetSlipEntity, slip => slip.user)
  bets: BetSlipEntity[];
}